from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Category, CustomUser, Product


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