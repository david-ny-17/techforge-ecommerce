from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin
from django.db.models import Count, Sum
from django.utils import timezone

from .models import (
    Category,
    CustomUser,
    Order,
    OrderItem,
    Product,
    Promotion,
    SavedBuild,
)


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "first_name", "last_name", "phone", "is_staff")
    list_filter = ("is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email", "first_name", "last_name", "phone")
    fieldsets = UserAdmin.fieldsets + (
        ("Información adicional", {"fields": ("phone", "address", "city")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Información adicional", {"fields": ("email", "phone", "address", "city")}),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "description")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "stock", "is_active", "created_at")
    list_display_links = ("name",)
    list_editable = ("price", "stock", "is_active")
    list_filter = ("category", "is_active", "created_at")
    search_fields = ("name", "description", "slug")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at")
    list_per_page = 25
    fieldsets = (
        ("Información general", {"fields": ("name", "slug", "category", "description", "is_active")}),
        ("Precio e inventario", {"fields": ("price", "stock")}),
        ("Imagen", {"fields": ("image", "image_url")}),
        ("Especificaciones técnicas (IA)", {"fields": ("specifications",)}),
        ("Auditoría", {"fields": ("created_at", "updated_at")}),
    )


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "quantity", "unit_price")
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "total", "status", "shipping_city", "payment_intent_id", "created_at")
    list_filter = ("status", "created_at")
    search_fields = (
        "user__username",
        "user__email",
        "id",
        "shipping_city",
        "shipping_address",
        "payment_intent_id",
    )
    readonly_fields = (
        "user",
        "total",
        "created_at",
        "shipping_address",
        "shipping_city",
        "payment_intent_id",
    )
    inlines = [OrderItemInline]


@admin.register(SavedBuild)
class SavedBuildAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "budget", "products_count", "total_price", "created_at")
    list_filter = ("created_at",)
    search_fields = ("name", "prompt", "user__username", "user__email")
    date_hierarchy = "created_at"
    raw_id_fields = ("user",)
    filter_horizontal = ("products",)
    readonly_fields = ("created_at",)
    list_per_page = 25
    fieldsets = (
        ("Armado", {"fields": ("name", "user", "prompt", "budget")}),
        ("Productos", {"fields": ("products",)}),
        ("Auditoría", {"fields": ("created_at",)}),
    )

    def get_queryset(self, request):
        # Cantidad y total se calculan en la misma consulta (sin una consulta por fila)
        return (
            super()
            .get_queryset(request)
            .select_related("user")
            .annotate(_products_count=Count("products"), _total_price=Sum("products__price"))
        )

    @admin.display(description="Productos", ordering="_products_count")
    def products_count(self, obj):
        return obj._products_count

    @admin.display(description="Total actual", ordering="_total_price")
    def total_price(self, obj):
        return f"S/ {obj._total_price or 0:.2f}"


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "discount_percent",
        "starts_at",
        "ends_at",
        "is_active",
        "status",
        "products_count",
        "categories_count",
    )
    list_filter = ("is_active", "starts_at", "ends_at", "categories")
    search_fields = ("name", "description")
    date_hierarchy = "starts_at"
    # Con 359 productos, un buscador es más cómodo que una lista doble
    autocomplete_fields = ("products",)
    filter_horizontal = ("categories",)
    readonly_fields = ("status", "created_at")
    list_per_page = 25
    actions = ("activate_promotions", "pause_promotions")
    fieldsets = (
        ("Oferta", {"fields": ("name", "description", "discount_percent")}),
        ("Vigencia", {"fields": ("starts_at", "ends_at", "is_active", "status")}),
        (
            "Alcance",
            {
                "fields": ("products", "categories"),
                "description": (
                    "Elige productos sueltos, categorías enteras o ambos. "
                    "Si un producto entra por varias ofertas, se aplica solo la de mayor descuento."
                ),
            },
        ),
        ("Auditoría", {"fields": ("created_at",)}),
    )

    def get_queryset(self, request):
        # Las cantidades se calculan en la misma consulta (sin una consulta por fila)
        return (
            super()
            .get_queryset(request)
            .annotate(
                _products_count=Count("products", distinct=True),
                _categories_count=Count("categories", distinct=True),
            )
        )

    @admin.display(description="Estado")
    def status(self, obj):
        if not obj.pk or not obj.starts_at or not obj.ends_at:
            return "-"
        now = timezone.now()
        if not obj.is_active:
            return "Pausada"
        if now < obj.starts_at:
            return "Programada"
        if now > obj.ends_at:
            return "Vencida"
        return "Vigente"

    @admin.display(description="Productos", ordering="_products_count")
    def products_count(self, obj):
        return obj._products_count

    @admin.display(description="Categorías", ordering="_categories_count")
    def categories_count(self, obj):
        return obj._categories_count

    @admin.action(description="Activar las promociones seleccionadas")
    def activate_promotions(self, request, queryset):
        ids = list(queryset.values_list("pk", flat=True))
        updated = Promotion.objects.filter(pk__in=ids).update(is_active=True)
        self.message_user(
            request, f"Se activaron {updated} promoción(es).", messages.SUCCESS
        )

    @admin.action(description="Pausar las promociones seleccionadas")
    def pause_promotions(self, request, queryset):
        ids = list(queryset.values_list("pk", flat=True))
        updated = Promotion.objects.filter(pk__in=ids).update(is_active=False)
        self.message_user(
            request, f"Se pausaron {updated} promoción(es).", messages.SUCCESS
        )

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        promotion = form.instance
        if not promotion.products.exists() and not promotion.categories.exists():
            self.message_user(
                request,
                "Esta promoción no tiene productos ni categorías: "
                "no afectará a ningún precio hasta que añadas alguno.",
                messages.WARNING,
            )