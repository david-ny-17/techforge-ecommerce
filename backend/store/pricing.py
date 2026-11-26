"""Cálculo de precios con promociones: la ÚNICA fuente de verdad del precio final.

- Product.price es el precio de lista y nunca se modifica.
- El descuento se calcula al vuelo con las promociones vigentes (Promotion.objects.current()).
- Si un producto entra por varias ofertas (directo o por su categoría), gana la de mayor
  descuento; nunca se suman.
- El precio EXACTO (Decimal, redondeado a céntimos) se calcula en Python con PromotionIndex.
  annotate_effective_price() añade el precio efectivo en la base de datos, y solo sirve para
  filtrar y ordenar por precio (es un número aproximado, no se muestra ni se cobra).
"""

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from django.db.models import (
    ExpressionWrapper,
    F,
    FloatField,
    IntegerField,
    OuterRef,
    Subquery,
    Value,
)
from django.db.models.functions import Cast, Coalesce, Greatest

from .models import Promotion

CENTS = Decimal("0.01")


def apply_discount(price, percent):
    """Precio con el descuento aplicado, redondeado a céntimos (mitad hacia arriba)."""
    price = Decimal(price)
    if not percent:
        return price.quantize(CENTS, rounding=ROUND_HALF_UP)
    discounted = price * Decimal(100 - percent) / Decimal(100)
    return discounted.quantize(CENTS, rounding=ROUND_HALF_UP)


@dataclass(frozen=True)
class Discount:
    percent: int
    name: str


@dataclass(frozen=True)
class PriceInfo:
    list_price: Decimal
    final_price: Decimal
    discount_percent: int
    promotion_name: str

    @property
    def on_sale(self):
        return self.discount_percent > 0

    @property
    def savings(self):
        return self.list_price - self.final_price


class PromotionIndex:
    """Promociones vigentes cargadas UNA vez (2 consultas), para calcular muchos precios
    sin una consulta por producto."""

    def __init__(self, by_product=None, by_category=None):
        self._by_product = by_product or {}
        self._by_category = by_category or {}

    def discount_for(self, product):
        """Mejor descuento vigente del producto (directo o por categoría), o None."""
        candidates = [
            discount
            for discount in (
                self._by_product.get(product.id),
                self._by_category.get(product.category_id),
            )
            if discount is not None
        ]
        if not candidates:
            return None
        return max(candidates, key=lambda d: (d.percent, d.name))

    def price_info(self, product):
        list_price = Decimal(product.price).quantize(CENTS, rounding=ROUND_HALF_UP)
        discount = self.discount_for(product)
        if discount is None:
            return PriceInfo(list_price, list_price, 0, "")
        return PriceInfo(
            list_price=list_price,
            final_price=apply_discount(list_price, discount.percent),
            discount_percent=discount.percent,
            promotion_name=discount.name,
        )


def _keep_best(target, key, discount):
    best = target.get(key)
    if best is None or (discount.percent, discount.name) > (best.percent, best.name):
        target[key] = discount


def build_promotion_index(now=None):
    """Carga las promociones vigentes ahora (o en `now`) y las deja listas para consultar."""
    current_ids = Promotion.objects.current(now).values("pk")

    by_product = {}
    product_rows = Promotion.products.through.objects.filter(
        promotion_id__in=current_ids
    ).values_list("product_id", "promotion__discount_percent", "promotion__name")
    for product_id, percent, name in product_rows:
        _keep_best(by_product, product_id, Discount(percent, name))

    by_category = {}
    category_rows = Promotion.categories.through.objects.filter(
        promotion_id__in=current_ids
    ).values_list("category_id", "promotion__discount_percent", "promotion__name")
    for category_id, percent, name in category_rows:
        _keep_best(by_category, category_id, Discount(percent, name))

    return PromotionIndex(by_product, by_category)


def annotate_effective_price(queryset, now=None):
    """Añade a un queryset de Product dos columnas calculadas en la base de datos:

    - promo_percent: mejor descuento vigente (0 si no hay oferta).
    - effective_price: precio con descuento, aproximado, solo para filtrar y ordenar.
    """
    current = Promotion.objects.current(now)
    by_product = (
        current.filter(products=OuterRef("pk"))
        .order_by("-discount_percent")
        .values("discount_percent")[:1]
    )
    by_category = (
        current.filter(categories=OuterRef("category_id"))
        .order_by("-discount_percent")
        .values("discount_percent")[:1]
    )
    return queryset.annotate(
        promo_percent=Greatest(
            Coalesce(Subquery(by_product), Value(0), output_field=IntegerField()),
            Coalesce(Subquery(by_category), Value(0), output_field=IntegerField()),
            output_field=IntegerField(),
        )
    ).annotate(
        effective_price=ExpressionWrapper(
            Cast("price", FloatField()) * (100 - F("promo_percent")) / 100.0,
            output_field=FloatField(),
        )
    )