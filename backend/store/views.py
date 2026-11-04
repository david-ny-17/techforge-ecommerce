import django_filters
from django.contrib.auth import get_user_model
from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    RegisterSerializer,
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
    pagination_class = None  # pocas categorías: se devuelven todas


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
    queryset = (
        Product.objects.filter(is_active=True)
        .select_related("category")
    )
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    filterset_class = ProductFilter
    search_fields = ["name", "description"]
    ordering_fields = ["price", "created_at", "name"]
    ordering = ["-created_at"]