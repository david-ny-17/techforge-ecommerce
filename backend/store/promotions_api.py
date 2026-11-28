from django.utils import timezone
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, Promotion


class PromotionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class PublicPromotionSerializer(serializers.ModelSerializer):
    categories = PromotionCategorySerializer(many=True, read_only=True)

    class Meta:
        model = Promotion
        fields = [
            "id",
            "name",
            "description",
            "discount_percent",
            "starts_at",
            "ends_at",
            "categories",
        ]


class PromotionListView(APIView):
    """Promociones vigentes ahora, para la barra de ofertas y la página /offers.

    Es público. Devuelve también la hora del servidor para que la cuenta regresiva
    del navegador no dependa del reloj (a veces desfasado) del equipo del cliente.
    """

    permission_classes = [AllowAny]
    # Sin autenticación: un token vencido en el navegador no debe dar 401 en un endpoint público
    authentication_classes = []

    def get(self, request):
        now = timezone.now()
        promotions = (
            Promotion.objects.current(now)
            .prefetch_related("categories")
            .order_by("-discount_percent", "ends_at", "id")
        )
        return Response(
            {
                "server_time": now,
                "promotions": PublicPromotionSerializer(promotions, many=True).data,
            }
        )