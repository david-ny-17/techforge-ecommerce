"""API del panel de administración. Todo lo de aquí exige is_staff=True."""
from collections import Counter
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Count, DecimalField, Exists, F, OuterRef, Q, Sum
from django.db.models.functions import Coalesce, TruncDate
from django.utils import timezone
from django.utils.text import slugify
from django_filters import rest_framework as filters
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Order, OrderItem, Product

User = get_user_model()

LOW_STOCK_THRESHOLD = 5
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB
MONEY = DecimalField(max_digits=14, decimal_places=2)

# "PC completa" = pedido pagado con estas 6 categorías (los mismos mínimos del Smart Builder)
PC_REQUIRED = (
    "procesadores",
    "placas-madre",
    "memoria-ram",
    "almacenamiento",
    "fuentes-de-poder",
    "gabinetes",
)
# "Setup completo" = una PC completa más estas 3 categorías en el mismo pedido
SETUP_EXTRA = ("monitores", "teclados", "mouses")


# ---------- Login con límite de intentos ----------

class LoginRateThrottle(AnonRateThrottle):
    """Máximo 10 intentos de login por minuto y por IP: frena la adivinación de contraseñas."""

    scope = "login"
    rate = "10/min"


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]


# ---------- Utilidades ----------

class AdminPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 50


def _money(value) -> float:
    return float(value or 0)


def _full_name(user) -> str:
    return user.get_full_name().strip() or user.username


def _unique_slug(name: str) -> str:
    base = slugify(name)[:200] or "producto"
    slug, n = base, 2
    while Product.objects.filter(slug=slug).exists():
        slug = f"{base}-{n}"
        n += 1
    return slug


def _image_storage():
    return Product._meta.get_field("image").storage


# ---------- Productos (CRUD) ----------

class AdminProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    # Si se deja vacío al crear, se genera a partir del nombre
    slug = serializers.SlugField(max_length=220, required=False, allow_blank=True)
    image = serializers.ImageField(required=False, allow_null=True)
    # true = borrar la imagen subida del producto
    remove_image = serializers.BooleanField(write_only=True, required=False)
    units_sold = serializers.SerializerMethodField()
    has_orders = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "category",
            "category_name",
            "category_slug",
            "description",
            "price",
            "stock",
            "image",
            "image_url",
            "remove_image",
            "specifications",
            "is_active",
            "units_sold",
            "has_orders",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
        extra_kwargs = {
            "name": {"min_length": 2},
            "price": {"min_value": Decimal("0.01")},
        }

    def get_units_sold(self, obj):
        value = getattr(obj, "units_sold", None)
        if value is None:  # producto recién creado, sin anotaciones de la consulta
            value = obj.order_items.filter(order__status=Order.Status.PAID).aggregate(
                n=Sum("quantity")
            )["n"]
        return value or 0

    def get_has_orders(self, obj):
        value = getattr(obj, "has_orders", None)
        return bool(value) if value is not None else obj.order_items.exists()

    def validate_slug(self, value):
        if not value:
            return value
        queryset = Product.objects.filter(slug=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Ya existe un producto con ese slug.")
        return value

    def validate_image(self, value):
        if value and value.size > MAX_IMAGE_BYTES:
            raise serializers.ValidationError("La imagen no puede superar los 5 MB.")
        return value

    def validate_specifications(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                'Las especificaciones deben ser un objeto JSON, por ejemplo {"socket": "AM5"}.'
            )
        if len(value) > 40:
            raise serializers.ValidationError("Máximo 40 especificaciones.")
        for key, item in value.items():
            if not isinstance(item, (str, int, float, bool)):
                raise serializers.ValidationError(
                    f"El valor de '{key}' debe ser texto, número o verdadero/falso."
                )
        return value

    def create(self, validated_data):
        validated_data.pop("remove_image", None)
        if not validated_data.get("slug"):
            validated_data["slug"] = _unique_slug(validated_data["name"])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        remove_image = validated_data.pop("remove_image", False)
        if not validated_data.get("slug"):
            validated_data.pop("slug", None)  # un slug vacío no cambia el actual
        if remove_image:
            validated_data["image"] = None

        old_name = instance.image.name if instance.image else None
        instance = super().update(instance, validated_data)
        new_name = instance.image.name if instance.image else None

        # Si la imagen cambió o se quitó, el archivo viejo se borra del disco
        if old_name and old_name != new_name:
            _image_storage().delete(old_name)
        return instance


class AdminProductFilter(filters.FilterSet):
    stock_lte = filters.NumberFilter(field_name="stock", lookup_expr="lte")
    stock_gte = filters.NumberFilter(field_name="stock", lookup_expr="gte")

    class Meta:
        model = Product
        fields = ["category", "is_active"]


class AdminProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminProductSerializer
    pagination_class = AdminPagination
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_class = AdminProductFilter
    search_fields = ["name", "slug", "description"]
    ordering_fields = ["name", "price", "stock", "created_at", "units_sold"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Product.objects.select_related("category").annotate(
            units_sold=Coalesce(
                Sum(
                    "order_items__quantity",
                    filter=Q(order_items__order__status=Order.Status.PAID),
                ),
                0,
            ),
            has_orders=Exists(OrderItem.objects.filter(product=OuterRef("pk"))),
        )

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()

        # Los pedidos guardan el producto: borrarlo rompería el historial de ventas.
        if OrderItem.objects.filter(product=product).exists():
            if product.is_active:
                product.is_active = False
                product.save(update_fields=["is_active", "updated_at"])
            return Response(
                {
                    "detail": "Este producto ya tiene pedidos, así que no se puede borrar "
                    "sin perder el historial de ventas. Se desactivó y ya no aparece en la tienda.",
                    "deactivated": True,
                }
            )

        image_name = product.image.name if product.image else None
        product.delete()
        if image_name:
            _image_storage().delete(image_name)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------- Pedidos (solo lectura) ----------

class AdminOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    category = serializers.CharField(source="product.category.name", read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product",
            "product_name",
            "product_slug",
            "category",
            "quantity",
            "unit_price",
            "subtotal",
        )
        read_only_fields = fields


class AdminOrderSerializer(serializers.ModelSerializer):
    customer = serializers.SerializerMethodField()
    items = AdminOrderItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "id",
            "customer",
            "total",
            "status",
            "created_at",
            "shipping_address",
            "shipping_city",
            "items_count",
            "items",
        )
        read_only_fields = fields

    def get_customer(self, obj):
        return {
            "id": obj.user_id,
            "username": obj.user.username,
            "name": _full_name(obj.user),
            "email": obj.user.email,
        }

    def get_items_count(self, obj):
        return sum(item.quantity for item in obj.items.all())


class AdminOrderViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminOrderSerializer
    pagination_class = AdminPagination
    filterset_fields = ["status"]
    search_fields = ["user__username", "user__email", "shipping_city", "shipping_address"]
    ordering_fields = ["created_at", "total"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Order.objects.select_related("user").prefetch_related("items__product__category")


# ---------- Clientes ----------

class AdminCustomerSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    orders_count = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "city",
            "date_joined",
            "last_login",
            "is_active",
            "orders_count",
            "total_spent",
        )
        # Lo único que un administrador puede cambiar de un cliente es is_active
        read_only_fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "city",
            "date_joined",
            "last_login",
        )

    def get_full_name(self, obj):
        return _full_name(obj)

    def get_orders_count(self, obj):
        return getattr(obj, "orders_paid", 0)

    def get_total_spent(self, obj):
        return _money(getattr(obj, "total_spent", 0))


class AdminCustomerViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Clientes (no incluye administradores). Se pueden ver y activar/desactivar."""

    permission_classes = [IsAdminUser]
    serializer_class = AdminCustomerSerializer
    pagination_class = AdminPagination
    http_method_names = ["get", "patch", "head", "options"]
    filterset_fields = ["is_active"]
    search_fields = ["username", "email", "first_name", "last_name", "phone"]
    ordering_fields = ["date_joined", "username", "orders_paid", "total_spent"]
    ordering = ["-date_joined"]

    def get_queryset(self):
        paid = Q(orders__status=Order.Status.PAID)
        return User.objects.filter(is_staff=False).annotate(
            orders_paid=Count("orders", filter=paid),
            total_spent=Coalesce(Sum("orders__total", filter=paid), Decimal("0"), output_field=MONEY),
        )


# ---------- Dashboard ----------

def _complete_builds(paid_orders):
    """(PCs completas, setups completos, laptops) vendidos en pedidos pagados."""
    pcs = setups = laptops = 0
    for order in paid_orders.prefetch_related("items__product__category"):
        units = Counter()
        for item in order.items.all():
            units[item.product.category.slug] += item.quantity
        laptops += units["laptops"]
        pc_units = min(units[slug] for slug in PC_REQUIRED)
        if pc_units > 0:
            pcs += pc_units
            setups += min([pc_units] + [units[slug] for slug in SETUP_EXTRA])
    return pcs, setups, laptops


def _product_ranking():
    """Top 5 de más vendidos y el menos vendido (entre los que sí se han vendido)."""
    rows = (
        OrderItem.objects.filter(order__status=Order.Status.PAID)
        .values("product_id", "product__name", "product__slug", "product__category__name")
        .annotate(
            units=Sum("quantity"),
            revenue=Sum(F("quantity") * F("unit_price"), output_field=MONEY),
        )
    )

    def shape(row):
        return {
            "product_id": row["product_id"],
            "name": row["product__name"],
            "slug": row["product__slug"],
            "category": row["product__category__name"],
            "units": row["units"],
            "revenue": _money(row["revenue"]),
        }

    top = [shape(row) for row in rows.order_by("-units", "-revenue")[:5]]
    least = rows.order_by("units", "revenue").first()
    return top, (shape(least) if least else None)


def _sales_series(paid_orders, today, days):
    start = today - timedelta(days=days - 1)
    rows = (
        paid_orders.filter(created_at__date__gte=start)
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(total=Sum("total"), orders=Count("id"))
    )
    by_day = {row["day"]: row for row in rows}
    series = []
    for offset in range(days):
        day = start + timedelta(days=offset)
        row = by_day.get(day)
        series.append(
            {
                "date": day.isoformat(),
                "total": _money(row["total"]) if row else 0.0,
                "orders": row["orders"] if row else 0,
            }
        )
    return series


class AdminDashboardView(APIView):
    """Todo lo que necesita el dashboard en una sola petición (el front la repite cada pocos segundos)."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            days = int(request.query_params.get("days", 30))
        except ValueError:
            days = 30
        days = max(7, min(days, 90))

        today = timezone.localdate()
        paid = Order.objects.filter(status=Order.Status.PAID)
        customers = User.objects.filter(is_staff=False)

        totals = paid.aggregate(total=Sum("total"), count=Count("id"))
        sales_today = paid.filter(created_at__date=today).aggregate(total=Sum("total"))["total"]
        status_counts = {
            row["status"]: row["n"]
            for row in Order.objects.values("status").annotate(n=Count("id"))
        }
        pcs, setups, laptops = _complete_builds(paid)
        top_products, least_sold = _product_ranking()

        recent_users = [
            {
                "id": user.id,
                "username": user.username,
                "name": _full_name(user),
                "email": user.email,
                "date_joined": user.date_joined.isoformat(),
            }
            for user in customers.order_by("-date_joined")[:8]
        ]
        recent_orders = [
            {
                "id": order.id,
                "customer": _full_name(order.user),
                "total": _money(order.total),
                "status": order.status,
                "created_at": order.created_at.isoformat(),
            }
            for order in Order.objects.select_related("user").order_by("-created_at")[:8]
        ]
        low_stock = [
            {
                "id": row["id"],
                "name": row["name"],
                "stock": row["stock"],
                "category": row["category__name"],
            }
            for row in Product.objects.filter(is_active=True, stock__lte=LOW_STOCK_THRESHOLD)
            .order_by("stock", "name")
            .values("id", "name", "stock", "category__name")[:6]
        ]

        return Response(
            {
                "generated_at": timezone.now().isoformat(),
                "kpis": {
                    "total_sales": _money(totals["total"]),
                    "sales_today": _money(sales_today),
                    "paid_orders": totals["count"],
                    "pending_orders": status_counts.get(Order.Status.PENDING, 0),
                    "customers": customers.count(),
                    "new_customers_today": customers.filter(date_joined__date=today).count(),
                    "pcs_sold": pcs,
                    "setups_sold": setups,
                    "laptops_sold": laptops,
                    "products_active": Product.objects.filter(is_active=True).count(),
                    "out_of_stock": Product.objects.filter(is_active=True, stock=0).count(),
                },
                "sales_series": _sales_series(paid, today, days),
                "top_products": top_products,
                "least_sold": least_sold,
                "recent_users": recent_users,
                "recent_orders": recent_orders,
                "low_stock": low_stock,
            }
        )