import re

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Category, Order, OrderItem, Product
from .pricing import build_promotion_index

User = get_user_model()

PHONE_PATTERN = re.compile(r"^[0-9+()\-\s]{6,20}$")


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "address",
            "city",
            "is_staff",
            "must_change_password",
        )
        # De SOLO LECTURA:
        # - username: es con lo que se inicia sesión
        # - is_staff / must_change_password: si no, un cliente podría darse permisos
        #   o saltarse el cambio obligatorio editando su perfil
        read_only_fields = ("id", "username", "is_staff", "must_change_password")

    def validate_email(self, value):
        value = value.strip().lower()
        queryset = User.objects.filter(email__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Ya existe una cuenta con este correo.")
        return value

    def validate_phone(self, value):
        if value and not PHONE_PATTERN.match(value):
            raise serializers.ValidationError(
                "Ingresa un teléfono válido (solo números, espacios y + - ( ))."
            )
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "password",
            "password2",
            "first_name",
            "last_name",
            "phone",
            "address",
            "city",
        )
        read_only_fields = ("id",)

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password2": "Las contraseñas no coinciden."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        return User.objects.create_user(**validated_data)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description")


class ProductSerializer(serializers.ModelSerializer):
    """Producto de cara al público (solo lectura).

    OJO: aquí `price` es el precio que se PAGA (ya con la promoción vigente, si la hay).
    El precio de lista va en `original_price`. En el panel de administración (admin_api.py)
    `price` sigue siendo el precio de lista, porque allí se edita.
    """

    category = CategorySerializer(read_only=True)
    image = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    original_price = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    promotion_name = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "price",
            "original_price",
            "discount_percent",
            "promotion_name",
            "stock",
            "image",
            "image_url",
            "specifications",
            "category",
            "is_active",
            "created_at",
            "updated_at",
        )

    def _price_info(self, obj):
        # Las promociones vigentes se cargan UNA vez y se comparten (vía el contexto) entre
        # todos los productos de la respuesta: no hay una consulta por producto.
        context = self.context
        index = context.get("promotion_index")
        if index is None:
            index = build_promotion_index()
            context["promotion_index"] = index
        return index.price_info(obj)

    def get_price(self, obj):
        return f"{self._price_info(obj).final_price:.2f}"

    def get_original_price(self, obj):
        return f"{self._price_info(obj).list_price:.2f}"

    def get_discount_percent(self, obj):
        return self._price_info(obj).discount_percent

    def get_promotion_name(self, obj):
        return self._price_info(obj).promotion_name

    def get_image(self, obj):
        # Devuelve la URL absoluta de la imagen subida (o None)
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url


# ---------- Pedidos ----------

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    subtotal = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product",
            "product_name",
            "product_slug",
            "quantity",
            "unit_price",
            "subtotal",
        )
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "total",
            "status",
            "created_at",
            "shipping_address",
            "shipping_city",
            "items",
            "coupon_code",
            "discount_amount",
        )
        read_only_fields = fields


# ---------- Entrada del checkout (validación del JSON recibido) ----------

class CartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=100)


class CartQuoteSerializer(serializers.Serializer):
    cart_items = CartItemSerializer(many=True, allow_empty=False, max_length=50)
    coupon_code = serializers.CharField(required=False, allow_blank=True, max_length=30)
    

class CreatePaymentIntentSerializer(serializers.Serializer):
    cart_items = CartItemSerializer(many=True, allow_empty=False)
    shipping_address = serializers.CharField(min_length=5, max_length=255)
    shipping_city = serializers.CharField(min_length=2, max_length=100)
    coupon_code = serializers.CharField(required=False, allow_blank=True, max_length=30)


class ConfirmPaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(min_value=1)


# ---------- Smart Builder ----------

class SmartBuilderRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField(min_length=10, max_length=600, trim_whitespace=True)
    history = serializers.ListField(child=serializers.DictField(), required=False, max_length=20)