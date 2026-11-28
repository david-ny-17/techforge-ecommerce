"""Reglas de los cupones: validación y cálculo del descuento (única fuente de verdad).

- El cupón se aplica sobre el subtotal YA rebajado por las promociones.
- Solo cuentan para los límites de uso los pedidos PAGADOS: los abandonados no gastan usos.
- El código no distingue mayúsculas (se normaliza a MAYÚSCULAS, igual que al guardarlo).
- El total nunca baja de MIN_PAYABLE_TOTAL, para no generar cobros que Stripe rechazaría.
"""

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from django.core.cache import cache

from django.utils import timezone

from .models import Coupon, Order

CENTS = Decimal("0.01")

# Total mínimo a cobrar después del cupón (en soles). Stripe exige un monto mínimo por
# cobro que depende de la moneda de liquidación de tu cuenta; este piso es conservador.
# Si tu cuenta permite un mínimo menor, puedes bajarlo aquí.
MIN_PAYABLE_TOTAL = Decimal("5.00")


class CouponError(Exception):
    """El cupón no se puede usar. El mensaje es apto para mostrarlo al cliente."""

class CouponNotFoundError(CouponError):
    """El código no existe o el cupón no está disponible (es lo que cuenta como intento
    de adivinar códigos; los demás errores, como la compra mínima, no limitan nada)."""


@dataclass(frozen=True)
class AppliedCoupon:
    coupon: Coupon
    discount: Decimal  # lo que descuenta el cupón
    total: Decimal  # subtotal - descuento (lo que se paga)


def normalize_code(raw):
    return str(raw or "").strip().upper()


def count_paid_uses(coupon, user=None):
    """Veces que se usó el cupón en pedidos PAGADOS (en total, o por un cliente)."""
    orders = Order.objects.filter(coupon=coupon, status=Order.Status.PAID)
    if user is not None:
        orders = orders.filter(user=user)
    return orders.count()


def usage_error(coupon, user=None):
    """Mensaje de error si el cupón ya no tiene usos disponibles; None si todavía los tiene.

    También se usa al confirmar el pago, para que un cupón no se pueda usar más veces
    que su límite aunque varios clientes paguen a la vez.
    """
    if coupon.max_uses is not None and count_paid_uses(coupon) >= coupon.max_uses:
        return "Este cupón se agotó."
    if (
        user is not None
        and getattr(user, "is_authenticated", False)
        and coupon.max_uses_per_user is not None
        and count_paid_uses(coupon, user) >= coupon.max_uses_per_user
    ):
        return "Ya usaste este cupón."
    return None


def compute_discount(coupon, subtotal):
    """Descuento en soles (redondeado a céntimos). Nunca deja el total bajo el mínimo."""
    subtotal = Decimal(subtotal)
    if coupon.discount_type == Coupon.DiscountType.PERCENT:
        raw = subtotal * Decimal(coupon.value) / Decimal(100)
    else:
        raw = Decimal(coupon.value)
    discount = raw.quantize(CENTS, rounding=ROUND_HALF_UP)

    ceiling = subtotal - MIN_PAYABLE_TOTAL
    if ceiling <= 0:
        return Decimal("0.00")
    return max(Decimal("0.00"), min(discount, ceiling)).quantize(CENTS)


def apply_coupon(raw_code, subtotal, user=None, now=None):
    """Valida el cupón para este subtotal (ya con ofertas) y calcula el descuento.

    `user` es opcional: sin sesión no se puede comprobar el límite por cliente (se vuelve
    a comprobar en el checkout, donde sí hay usuario). Lanza CouponError si no se puede usar.
    """
    code = normalize_code(raw_code)
    if not code:
        raise CouponError("Escribe un código de cupón.")

    subtotal = Decimal(subtotal)
    now = now or timezone.now()

    coupon = Coupon.objects.filter(code=code).first()
    if coupon is None or not coupon.is_active:
        raise CouponNotFoundError("Este cupón no existe o no está disponible.")
    if coupon.starts_at and now < coupon.starts_at:
        raise CouponError("Este cupón todavía no está vigente.")
    if coupon.expires_at and now > coupon.expires_at:
        raise CouponError("Este cupón ya venció.")

    message = usage_error(coupon, user)
    if message:
        raise CouponError(message)

    if subtotal < coupon.min_purchase:
        raise CouponError(
            f"Este cupón requiere una compra mínima de S/ {coupon.min_purchase:.2f}."
        )

    discount = compute_discount(coupon, subtotal)
    if discount <= 0:
        raise CouponError("Tu compra es demasiado pequeña para usar este cupón.")

    return AppliedCoupon(coupon=coupon, discount=discount, total=subtotal - discount)

# ---------- Límite de intentos fallidos (contra quien intenta adivinar códigos) ----------

MAX_FAILED_ATTEMPTS = 10  # intentos con un código inexistente por IP...
FAILURE_WINDOW_SECONDS = 60  # ...dentro de esta ventana de tiempo
RATE_LIMIT_MESSAGE = "Demasiados intentos con cupones. Espera un minuto e inténtalo de nuevo."


def _failure_key(ident):
    return f"coupon-failures:{ident}"


def is_rate_limited(ident):
    """True si esta IP ya agotó sus intentos fallidos con cupones en el último minuto."""
    return cache.get(_failure_key(ident), 0) >= MAX_FAILED_ATTEMPTS


def register_failure(ident):
    """Anota un intento fallido (código inexistente) de esta IP."""
    key = _failure_key(ident)
    cache.add(key, 0, FAILURE_WINDOW_SECONDS)  # crea el contador solo si no existe
    try:
        cache.incr(key)
    except ValueError:  # el contador expiró justo ahora
        cache.set(key, 1, FAILURE_WINDOW_SECONDS)