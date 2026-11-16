from django.db import transaction
from rest_framework import serializers, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from .models import Product, SavedBuild
from .serializers import ProductSerializer

MAX_SAVED_BUILDS = 20  # por usuario
MAX_BUILD_PRODUCTS = 15  # igual que MAX_RECOMMENDED en ai_service.py


class SavedBuildSerializer(serializers.ModelSerializer):
    # Lectura: productos completos con precio y stock ACTUALES (no una copia vieja)
    products = serializers.SerializerMethodField()
    # Escritura: solo los IDs de los productos
    product_ids = serializers.PrimaryKeyRelatedField(
        source="products",
        queryset=Product.objects.filter(is_active=True),
        many=True,
        write_only=True,
        allow_empty=False,
    )

    class Meta:
        model = SavedBuild
        fields = ("id", "name", "prompt", "budget", "products", "product_ids", "created_at")
        read_only_fields = ("id", "created_at")

    def get_products(self, obj):
        # Los productos que se desactivaron en la tienda dejan de mostrarse
        items = [p for p in obj.products.all() if p.is_active]
        items.sort(key=lambda p: (p.category.name, p.price))
        return ProductSerializer(items, many=True, context=self.context).data

    def validate_product_ids(self, products):
        unique = list(dict.fromkeys(products))  # sin repetidos, en el mismo orden
        if len(unique) > MAX_BUILD_PRODUCTS:
            raise serializers.ValidationError(
                f"Un armado puede tener como máximo {MAX_BUILD_PRODUCTS} productos."
            )
        return unique

    def validate_budget(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("El presupuesto debe ser mayor que cero.")
        return value

    def create(self, validated_data):
        products = validated_data.pop("products")
        with transaction.atomic():
            build = SavedBuild.objects.create(**validated_data)
            build.products.set(products)
        return build


class SavedBuildViewSet(viewsets.ModelViewSet):
    """Armados guardados: listar, crear y eliminar. Cada usuario solo ve los suyos."""

    serializer_class = SavedBuildSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # máximo 20 por usuario: se devuelven todos en un array
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return SavedBuild.objects.filter(user=self.request.user).prefetch_related(
            "products__category"
        )

    def perform_create(self, serializer):
        if self.get_queryset().count() >= MAX_SAVED_BUILDS:
            raise ValidationError(
                {
                    "detail": f"Alcanzaste el máximo de {MAX_SAVED_BUILDS} armados guardados. "
                    "Elimina alguno en «Mis armados»."
                }
            )
        serializer.save(user=self.request.user)