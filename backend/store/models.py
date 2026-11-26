from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class CustomUser(AbstractUser):
    email = models.EmailField("correo electrónico", unique=True)
    phone = models.CharField("teléfono", max_length=20, blank=True)
    address = models.CharField("dirección", max_length=255, blank=True)
    city = models.CharField("ciudad", max_length=100, blank=True)
    must_change_password = models.BooleanField(
        "debe cambiar la contraseña",
        default=False,
        help_text="Si está activo, el usuario debe elegir una contraseña nueva antes de usar el panel.",
    )

    class Meta:
        verbose_name = "usuario"
        verbose_name_plural = "usuarios"

    def __str__(self):
        return self.username


class Category(models.Model):
    name = models.CharField("nombre", max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField("descripción", blank=True)

    class Meta:
        verbose_name = "categoría"
        verbose_name_plural = "categorías"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
        verbose_name="categoría",
    )
    name = models.CharField("nombre", max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    description = models.TextField("descripción", blank=True)
    price = models.DecimalField("precio", max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    image = models.ImageField("imagen", upload_to="products/", blank=True, null=True)
    image_url = models.URLField("URL de imagen", blank=True)
    specifications = models.JSONField(
        "especificaciones",
        default=dict,
        blank=True,
        help_text='Ej: {"socket": "AM5", "ram_type": "DDR5", "watts": 650}',
    )
    is_active = models.BooleanField("activo", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "producto"
        verbose_name_plural = "productos"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pendiente"
        PAID = "PAID", "Pagado"
        FAILED = "FAILED", "Fallido"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
        verbose_name="usuario",
    )
    total = models.DecimalField("total", max_digits=12, decimal_places=2)
    status = models.CharField(
        "estado", max_length=10, choices=Status.choices, default=Status.PENDING
    )
    created_at = models.DateTimeField("fecha de creación", auto_now_add=True)
    shipping_address = models.CharField(
        "dirección de envío", max_length=255, blank=True, default=""
    )
    shipping_city = models.CharField(
        "ciudad de envío", max_length=100, blank=True, default=""
    )

    payment_intent_id = models.CharField(
        "ID del pago (Stripe)", max_length=100, blank=True, default="", db_index=True
    )

    class Meta:
        verbose_name = "pedido"
        verbose_name_plural = "pedidos"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Pedido #{self.pk} - {self.user} - {self.status}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items", verbose_name="pedido"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="order_items",
        verbose_name="producto",
    )
    quantity = models.PositiveIntegerField("cantidad")
    unit_price = models.DecimalField(
        "precio unitario", max_digits=10, decimal_places=2
    )
    list_price = models.DecimalField(
        "precio de lista",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        editable=False,
        help_text=(
            "Precio de lista del producto al comprar (antes de promociones). "
            "Vacío en los pedidos anteriores a las promociones."
        ),
    )

    class Meta:
        verbose_name = "detalle de pedido"
        verbose_name_plural = "detalles de pedido"

    @property
    def subtotal(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"


class SavedBuild(models.Model):
    """Armado del Smart Builder que el usuario guardó.

    Guarda solo QUÉ productos son: el precio y el stock se leen siempre de los
    productos reales, así que nunca quedan desactualizados.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_builds",
        verbose_name="usuario",
    )
    name = models.CharField("nombre", max_length=100)
    prompt = models.CharField("consulta original", max_length=600, blank=True)
    budget = models.DecimalField(
        "presupuesto", max_digits=10, decimal_places=2, null=True, blank=True
    )
    products = models.ManyToManyField(
        Product, related_name="saved_builds", verbose_name="productos"
    )
    created_at = models.DateTimeField("fecha de creación", auto_now_add=True)

    class Meta:
        verbose_name = "armado guardado"
        verbose_name_plural = "armados guardados"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.user})"


class PromotionQuerySet(models.QuerySet):
    def current(self, now=None):
        """Promociones vigentes ahora: activas y dentro de su rango de fechas."""
        now = now or timezone.now()
        return self.filter(is_active=True, starts_at__lte=now, ends_at__gte=now)


class Promotion(models.Model):
    """Oferta con un porcentaje de descuento sobre productos y/o categorías enteras.

    El precio del producto NO se modifica: el precio final se calcula al vuelo
    mientras la promoción está vigente. Si un producto entra por varias promociones
    (directo o por su categoría), se aplica solo la de mayor descuento (no se suman).
    """

    name = models.CharField("nombre", max_length=120)
    description = models.CharField("descripción", max_length=255, blank=True)
    discount_percent = models.PositiveSmallIntegerField(
        "descuento (%)",
        validators=[MinValueValidator(1), MaxValueValidator(90)],
        help_text="Entero entre 1 y 90.",
    )
    starts_at = models.DateTimeField("inicio")
    ends_at = models.DateTimeField("fin")
    is_active = models.BooleanField(
        "activa",
        default=True,
        help_text="Desmárcala para pausar la oferta sin borrarla.",
    )
    products = models.ManyToManyField(
        Product,
        related_name="promotions",
        blank=True,
        verbose_name="productos",
        help_text="Productos individuales en oferta.",
    )
    categories = models.ManyToManyField(
        Category,
        related_name="promotions",
        blank=True,
        verbose_name="categorías",
        help_text="Todos los productos de estas categorías entran en la oferta.",
    )
    created_at = models.DateTimeField("fecha de creación", auto_now_add=True)

    objects = PromotionQuerySet.as_manager()

    class Meta:
        verbose_name = "promoción"
        verbose_name_plural = "promociones"
        ordering = ["-starts_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(discount_percent__gte=1, discount_percent__lte=90),
                name="promotion_discount_between_1_and_90",
            ),
            models.CheckConstraint(
                condition=models.Q(ends_at__gt=models.F("starts_at")),
                name="promotion_ends_after_start",
            ),
        ]

    def clean(self):
        super().clean()
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValidationError(
                {"ends_at": "La fecha de fin debe ser posterior a la de inicio."}
            )

    @property
    def is_current(self):
        now = timezone.now()
        return self.is_active and self.starts_at <= now <= self.ends_at

    def __str__(self):
        return f"{self.name} (-{self.discount_percent} %)"