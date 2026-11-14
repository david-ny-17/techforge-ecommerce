from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    CategoryViewSet,
    ConfirmPaymentView,
    CreatePaymentIntentView,
    OrderHistoryView,
    ProductViewSet,
    RegisterView,
    SmartBuilderView,
    UserProfileView,
)

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("products", ProductViewSet, basename="product")

urlpatterns = [
    # Autenticación
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/profile/", UserProfileView.as_view(), name="profile"),
    # Pedidos y pagos (Stripe)
    path("create-payment-intent/", CreatePaymentIntentView.as_view(), name="create-payment-intent"),
    path("confirm-payment/", ConfirmPaymentView.as_view(), name="confirm-payment"),
    path("orders/", OrderHistoryView.as_view(), name="order-history"),
    path("smart-builder/", SmartBuilderView.as_view(), name="smart-builder"),
    # Catálogo
    path("", include(router.urls)),
]