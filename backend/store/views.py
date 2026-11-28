import logging
from decimal import ROUND_HALF_UP, Decimal

import django_filters
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from stripe import StripeClient, StripeError

from .ai_service import AIServiceError, get_pc_build_recommendation
from .coupons import (
    RATE_LIMIT_MESSAGE,
    CouponError,
    CouponNotFoundError,
    apply_coupon,
    is_rate_limited,
    register_failure,
    usage_error,
)
from .models import Category, Coupon, Order, OrderItem, Product
from .pricing import annotate_effective_price, build_promotion_index
from .serializers import (
    CartQuoteSerializer,
    CategorySerializer,
    ConfirmPaymentSerializer,
    CreatePaymentIntentSerializer,
    OrderSerializer,
    ProductSerializer,
    RegisterSerializer,
    SmartBuilderRequestSerializer,
    UserSerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)


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


# Los precios se comparan con el precio EFECTIVO (ya con la promoción vigente), calculado
# en la base de datos como número decimal aproximado. Esta tolerancia (medio céntimo)
# evita que un error de redondeo deje fuera un precio exacto, p. ej. S/ 800.00.
PRICE_TOLERANCE = 0.005


class ProductFilter(django_filters.FilterSet):
    category = django_filters.NumberFilter(field_name="category__id")
    category_slug = django_filters.CharFilter(field_name="category__slug")
    min_price = django_filters.NumberFilter(method="filter_min_price")
    max_price = django_filters.NumberFilter(method="filter_max_price")
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")
    on_sale = django_filters.BooleanFilter(method="filter_on_sale")

    class Meta:
        model = Product
        fields = [
            "category",
            "category_slug",
            "min_price",
            "max_price",
            "in_stock",
            "on_sale",
        ]

    def filter_min_price(self, queryset, name, value):
        return queryset.filter(effective_price__gte=float(value) - PRICE_TOLERANCE)

    def filter_max_price(self, queryset, name, value):
        return queryset.filter(effective_price__lte=float(value) + PRICE_TOLERANCE)

    def filter_in_stock(self, queryset, name, value):
        return queryset.filter(stock__gt=0) if value else queryset

    def filter_on_sale(self, queryset, name, value):
        return queryset.filter(promo_percent__gt=0) if value else queryset


class ProductOrderingFilter(OrderingFilter):
    """Igual que OrderingFilter, pero "price" ordena por el precio con promoción y el
    orden es estable: se desempata por id para que la paginación no repita productos."""

    ALIASES = {"price": "effective_price", "-price": "-effective_price"}

    def get_ordering(self, request, queryset, view):
        ordering = super().get_ordering(request, queryset, view)
        if not ordering:
            return ordering
        ordering = [self.ALIASES.get(term, term) for term in ordering]
        if "id" not in ordering and "-id" not in ordering:
            ordering.append("id")
        return ordering


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True).select_related("category")
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, SearchFilter, ProductOrderingFilter]
    filterset_class = ProductFilter
    search_fields = ["name", "description"]
    ordering_fields = ["price", "created_at", "name"]
    ordering = ["-created_at"]

    def get_queryset(self):
        # Añade promo_percent y effective_price (el filtro y el orden por precio los usan)
        return annotate_effective_price(
            Product.objects.filter(is_active=True).select_related("category")
        )


# ---------- Carrito: precios vigentes ----------

class CartQuoteView(APIView):
    """Calcula con los precios VIGENTES (promociones incluidas) el total de un carrito.

    Es público (el carrito funciona sin sesión) y no modifica nada: sirve para que el
    frontend muestre el mismo total que luego cobra el checkout.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CartQuoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Une productos repetidos, igual que el checkout: {product_id: cantidad_total}
        quantities = {}
        for item in serializer.validated_data["cart_items"]:
            pid = item["product_id"]
            quantities[pid] = quantities.get(pid, 0) + item["quantity"]

        products = Product.objects.filter(id__in=quantities.keys(), is_active=True)
        products_by_id = {product.id: product for product in products}
        promotions = build_promotion_index()

        items = []
        unavailable = []  # productos que ya no existen o se desactivaron
        list_total = Decimal("0.00")
        total = Decimal("0.00")
        for pid, qty in quantities.items():
            product = products_by_id.get(pid)
            if product is None:
                unavailable.append(pid)
                continue
            info = promotions.price_info(product)
            list_total += info.list_price * qty
            total += info.final_price * qty
            items.append(
                {
                    "product_id": product.id,
                    "slug": product.slug,
                    "name": product.name,
                    "quantity": qty,
                    "stock": product.stock,
                    "price": f"{info.final_price:.2f}",
                    "original_price": f"{info.list_price:.2f}",
                    "discount_percent": info.discount_percent,
                    "promotion_name": info.promotion_name,
                    "line_total": f"{info.final_price * qty:.2f}",
                }
            )

        # Cupón (opcional): se valida sobre el subtotal YA rebajado por las ofertas.
        # Si no sirve, la cotización se devuelve igual, con el motivo en coupon_error.
        code = serializer.validated_data.get("coupon_code", "").strip()
        applied = None
        coupon_error = None
        if code:
            ident = request.META.get("REMOTE_ADDR", "desconocido")
            if is_rate_limited(ident):
                coupon_error = RATE_LIMIT_MESSAGE
            else:
                try:
                    applied = apply_coupon(code, total, user=request.user)
                except CouponNotFoundError as exc:
                    register_failure(ident)  # solo los códigos inexistentes cuentan
                    coupon_error = str(exc)
                except CouponError as exc:
                    coupon_error = str(exc)

        coupon_discount = applied.discount if applied else Decimal("0.00")
        coupon_data = None
        if applied:
            coupon_data = {
                "code": applied.coupon.code,
                "label": applied.coupon.discount_label,
                "description": applied.coupon.description,
                "discount": f"{applied.discount:.2f}",
            }

        return Response(
            {
                "items": items,
                "unavailable": unavailable,
                "list_total": f"{list_total:.2f}",
                "discount_total": f"{list_total - total:.2f}",
                "subtotal": f"{total:.2f}",
                "coupon": coupon_data,
                "coupon_discount": f"{coupon_discount:.2f}",
                "coupon_error": coupon_error,
                "total": f"{total - coupon_discount:.2f}",
            }
        )


# ---------- Pedidos y pagos con Stripe ----------

class CheckoutError(Exception):
    """Error de negocio: el pedido no se puede preparar (productos, stock...)."""


class PaymentServiceError(Exception):
    """Stripe no está configurado en el servidor."""


def get_stripe_client():
    if not settings.STRIPE_SECRET_KEY:
        raise PaymentServiceError("El servicio de pagos no está configurado.")
    return StripeClient(settings.STRIPE_SECRET_KEY)


def to_cents(amount):
    """Soles -> céntimos: Stripe trabaja con enteros en la unidad mínima de la moneda."""
    return int((Decimal(amount) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def mark_order_paid(order_id, client):
    """Pasa el pedido a PAID y descuenta el stock, una sola vez.

    Devuelve (pedido, reembolsado, motivo). Si el stock se agotó o el cupón llegó a su
    límite de usos mientras el cliente pagaba, el pedido queda FAILED y el dinero se
    devuelve automáticamente; `motivo` explica por qué (vacío si todo salió bien).
    """
    needs_refund = False
    reason = ""

    with transaction.atomic():
        order = Order.objects.select_for_update().get(pk=order_id)
        if order.status == Order.Status.PAID:
            return order, False, ""  # ya estaba pagado: no se descuenta stock dos veces

        items = list(order.items.all())
        products = {
            product.id: product
            for product in Product.objects.select_for_update().filter(
                id__in=[item.product_id for item in items]
            )
        }

        # El cupón se vuelve a comprobar AQUÍ, con su fila bloqueada: así dos clientes que
        # pagan a la vez no pueden pasarse del límite de usos.
        coupon_problem = ""
        if order.coupon_id:
            coupon = Coupon.objects.select_for_update().get(pk=order.coupon_id)
            error = usage_error(coupon, order.user)
            if error:
                coupon_problem = (
                    f"No se pudo aplicar el cupón {order.coupon_code}: "
                    f"{error[0].lower()}{error[1:]}"
                )

        out_of_stock = any(
            products[item.product_id].stock < item.quantity for item in items
        )
        if out_of_stock or coupon_problem:
            reason = (
                "Un producto se agotó mientras pagabas." if out_of_stock else coupon_problem
            )
            order.status = Order.Status.FAILED
            order.save(update_fields=["status"])
            needs_refund = True
        else:
            for item in items:
                product = products[item.product_id]
                product.stock -= item.quantity
                product.save(update_fields=["stock", "updated_at"])
            order.status = Order.Status.PAID
            order.save(update_fields=["status"])

    if needs_refund:
        try:
            client.refunds.create(params={"payment_intent": order.payment_intent_id})
        except StripeError:
            # Revisar y reembolsar a mano desde el Dashboard de Stripe
            logger.exception("No se pudo reembolsar el pedido %s", order.pk)

    return order, needs_refund, reason


def mark_order_failed(order_id):
    # Un pedido ya pagado nunca vuelve a "fallido"
    Order.objects.filter(pk=order_id).exclude(status=Order.Status.PAID).update(
        status=Order.Status.FAILED
    )


class CreatePaymentIntentView(APIView):
    """Crea el pedido (PENDING) y el PaymentIntent de Stripe. Devuelve el client_secret."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreatePaymentIntentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            client = get_stripe_client()
        except PaymentServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Une productos repetidos en el carrito: {product_id: cantidad_total}
        quantities = {}
        for item in data["cart_items"]:
            pid = item["product_id"]
            quantities[pid] = quantities.get(pid, 0) + item["quantity"]

        try:
            with transaction.atomic():
                products = Product.objects.filter(id__in=quantities.keys(), is_active=True)
                products_by_id = {p.id: p for p in products}

                missing = sorted(set(quantities) - set(products_by_id))
                if missing:
                    raise CheckoutError(f"Productos no disponibles: {missing}")

                # El precio SIEMPRE se calcula en el servidor (base de datos + promociones
                # vigentes), nunca se toma del front. Queda congelado en el pedido.
                promotions = build_promotion_index()
                total = Decimal("0.00")
                lines = []
                for pid, qty in quantities.items():
                    product = products_by_id[pid]
                    if product.stock < qty:
                        raise CheckoutError(
                            f"Stock insuficiente para '{product.name}' "
                            f"(disponible: {product.stock})."
                        )
                    info = promotions.price_info(product)
                    total += info.final_price * qty
                    lines.append((product, qty, info))

                # Cupón (opcional): se valida en el servidor sobre el subtotal YA rebajado
                coupon = None
                discount = Decimal("0.00")
                code = data.get("coupon_code", "").strip()
                if code:
                    ident = request.META.get("REMOTE_ADDR", "desconocido")
                    if is_rate_limited(ident):
                        raise CheckoutError(RATE_LIMIT_MESSAGE)
                    try:
                        applied = apply_coupon(code, total, user=request.user)
                    except CouponNotFoundError as exc:
                        register_failure(ident)  # solo los códigos inexistentes cuentan
                        raise CheckoutError(str(exc)) from exc
                    except CouponError as exc:
                        raise CheckoutError(str(exc)) from exc
                    coupon, discount = applied.coupon, applied.discount

                order = Order.objects.create(
                    user=request.user,
                    total=total - discount,
                    coupon=coupon,
                    coupon_code=coupon.code if coupon else "",
                    discount_amount=discount,
                    status=Order.Status.PENDING,
                    shipping_address=data["shipping_address"],
                    shipping_city=data["shipping_city"],
                )
                OrderItem.objects.bulk_create(
                    [
                        OrderItem(
                            order=order,
                            product=product,
                            quantity=qty,
                            unit_price=info.final_price,
                            list_price=info.list_price,
                        )
                        for product, qty, info in lines
                    ]
                )
        except CheckoutError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # La llamada a Stripe va fuera de la transacción para no mantener bloqueos
        try:
            intent = client.payment_intents.create(
                params={
                    "amount": to_cents(order.total),
                    "currency": "pen",
                    "automatic_payment_methods": {"enabled": True, "allow_redirects": "never"},
                    "description": f"Pedido TechForge #{order.id}",
                    "metadata": {"order_id": str(order.id)},
                }
            )
        except StripeError:
            order.delete()  # nunca se llegó a cobrar: no dejamos un pedido huérfano
            return Response(
                {"detail": "No se pudo iniciar el pago con Stripe. Inténtalo de nuevo."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        order.payment_intent_id = intent.id
        order.save(update_fields=["payment_intent_id"])

        return Response(
            {"order_id": order.id, "client_secret": intent.client_secret},
            status=status.HTTP_201_CREATED,
        )


class ConfirmPaymentView(APIView):
    """El servidor le pregunta a Stripe si el pago se completó; el navegador no decide nada."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ConfirmPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = get_object_or_404(
            Order, pk=serializer.validated_data["order_id"], user=request.user
        )
        if not order.payment_intent_id:
            return Response(
                {"detail": "Este pedido no tiene un pago asociado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            client = get_stripe_client()
            intent = client.payment_intents.retrieve(order.payment_intent_id)
        except PaymentServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except StripeError:
            return Response(
                {"detail": "No se pudo verificar el pago con Stripe. Inténtalo de nuevo."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Defensa: lo cobrado debe coincidir exactamente con el pedido
        if intent.amount != to_cents(order.total) or intent.currency != "pen":
            return Response(
                {"detail": "El monto del pago no coincide con el pedido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if intent.status == "succeeded":
            order, refunded, reason = mark_order_paid(order.pk, client)
            if refunded:
                return Response(
                    {
                        "detail": f"{reason} Te reembolsamos el importe automáticamente.",
                        "order": OrderSerializer(order).data,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response({"detail": "Pago aprobado.", "order": OrderSerializer(order).data})

        rejected = intent.status == "canceled" or (
            intent.status == "requires_payment_method"
            and getattr(intent, "last_payment_error", None)
        )
        if rejected:
            mark_order_failed(order.pk)
            order.refresh_from_db()
            return Response(
                {
                    "detail": "Pago rechazado. Intenta con otra tarjeta.",
                    "order": OrderSerializer(order).data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Pago en proceso o pendiente de autenticación
        return Response(
            {"detail": "Tu pago aún no se completó.", "order": OrderSerializer(order).data},
            status=status.HTTP_202_ACCEPTED,
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
            result = get_pc_build_recommendation(serializer.validated_data["prompt"], serializer.validated_data.get("history"))
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

        return Response({"message": result["message"], "products": data, "budget_pen": result["budget_pen"]})