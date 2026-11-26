from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.db.models import Count, Sum

from .models import Category, CustomUser, Order, OrderItem, Product, SavedBuild


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