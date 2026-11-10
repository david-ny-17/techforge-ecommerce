from decimal import Decimal

import django_filters
import time
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from django.conf import settings

from .ai_service import AIServiceError, get_pc_build_recommendation
from .models import Category, Order, OrderItem, Product
from .serializers import (
    CategorySerializer,
    CheckoutSerializer,
    OrderSerializer,
    ProductSerializer,
    RegisterSerializer,
    SmartBuilderRequestSerializer,
    UserSerializer,
)

User = get_user_model()


# ---------- Autenticación ----------

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# ---------- Catálogo ----------

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    pagination_class = None


class ProductFilter(django_filters.FilterSet):
    category = django_filters.NumberFilter(field_name="category__id")
    category_slug = django_filters.CharFilter(field_name="category__slug")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")

    class Meta:
        model = Product
        fields = ["category", "category_slug", "min_price", "max_price", "in_stock"]

    def filter_in_stock(self, queryset, name, value):
        return queryset.filter(stock__gt=0) if value else queryset


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True).select_related("category")
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    filterset_class = ProductFilter
    search_fields = ["name", "description"]
    ordering_fields = ["price", "created_at", "name"]
    ordering = ["-created_at"]


# ---------- Pedidos y checkout simulado ----------

class CheckoutError(Exception):
    """Error de negocio: provoca rollback de la transacción."""


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart_items = serializer.validated_data["cart_items"]
        card_number = serializer.validated_data["payment_info"]["card_number"]
        shipping_address = serializer.validated_data["shipping_address"]
        shipping_city = serializer.validated_data["shipping_city"]

        # Une productos repetidos en el carrito: {product_id: cantidad_total}
        quantities = {}
        for item in cart_items:
            pid = item["product_id"]
            quantities[pid] = quantities.get(pid, 0) + item["quantity"]

        # Pago simulado: aprueba solo si la tarjeta termina en 4242
        payment_approved = card_number.endswith("4242")
        time.sleep(settings.PAYMENT_SIMULATED_DELAY)

        try:
            with transaction.atomic():
                products = Product.objects.select_for_update().filter(
                    id__in=quantities.keys(), is_active=True
                )
                products_by_id = {p.id: p for p in products}

                missing = sorted(set(quantities) - set(products_by_id))
                if missing:
                    raise CheckoutError(
                        f"Productos no disponibles: {missing}"
                    )

                # El precio SIEMPRE se toma de la base de datos, nunca del front
                total = Decimal("0.00")
                lines = []
                for pid, qty in quantities.items():
                    product = products_by_id[pid]
                    if product.stock < qty:
                        raise CheckoutError(
                            f"Stock insuficiente para '{product.name}' "
                            f"(disponible: {product.stock})."
                        )
                    total += product.price * qty
                    lines.append((product, qty))

                order = Order.objects.create(
                    user=request.user,
                    total=total,
                    status=(
                        Order.Status.PAID if payment_approved else Order.Status.FAILED
                    ),
                    shipping_address=shipping_address,
                    shipping_city=shipping_city,
                )
                OrderItem.objects.bulk_create(
                    [
                        OrderItem(
                            order=order,
                            product=product,
                            quantity=qty,
                            unit_price=product.price,
                        )
                        for product, qty in lines
                    ]
                )

                # El stock solo se descuenta si el pago fue aprobado
                if payment_approved:
                    for product, qty in lines:
                        product.stock -= qty
                        product.save(update_fields=["stock", "updated_at"])

        except CheckoutError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        data = OrderSerializer(order).data

        if not payment_approved:
            return Response(
                {"detail": "Pago rechazado. Tarjeta no válida.", "order": data},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"detail": "Pago aprobado.", "order": data},
            status=status.HTTP_201_CREATED,
        )


class OrderHistoryView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items__product")
            .order_by("-created_at")
        )

# ---------- Smart Builder (IA) ----------

class SmartBuilderView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "smart_builder"

    def post(self, request):
        serializer = SmartBuilderRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = get_pc_build_recommendation(serializer.validated_data["prompt"])
        except AIServiceError as exc:
            return Response({"detail": str(exc)}, status=exc.status_code)

        ids = result["recommended_product_ids"]
        products = Product.objects.filter(id__in=ids, is_active=True).select_related(
            "category"
        )
        by_id = {product.id: product for product in products}
        ordered = [by_id[pid] for pid in ids if pid in by_id]

        # El contexto con `request` es necesario para que la imagen salga con URL absoluta
        data = ProductSerializer(ordered, many=True, context={"request": request}).data

        return Response({"message": result["message"], "products": data})