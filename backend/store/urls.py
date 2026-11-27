from django.urls import include, path
from rest_framework.routers import DefaultRouter, SimpleRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .account_api import ChangePasswordView
from .admin_api import (
    AdminCustomerViewSet,
    AdminDashboardView,
    AdminOrderViewSet,
    AdminProductViewSet,
    ThrottledTokenObtainPairView,
)
from .saved_builds import SavedBuildViewSet
from .views import (
    CartQuoteView,
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
router.register("builds", SavedBuildViewSet, basename="saved-build")

admin_router = SimpleRouter()
admin_router.register("products", AdminProductViewSet, basename="admin-product")
admin_router.register("orders", AdminOrderViewSet, basename="admin-order")
admin_router.register("customers", AdminCustomerViewSet, basename="admin-customer")

urlpatterns = [
    # Autenticación
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", ThrottledTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/profile/", UserProfileView.as_view(), name="profile"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    # Carrito: precios vigentes
    path("cart/quote/", CartQuoteView.as_view(), name="cart-quote"),
    # Pedidos y pagos (Stripe)
    path("create-payment-intent/", CreatePaymentIntentView.as_view(), name="create-payment-intent"),
    path("confirm-payment/", ConfirmPaymentView.as_view(), name="confirm-payment"),
    path("orders/", OrderHistoryView.as_view(), name="order-history"),
    path("smart-builder/", SmartBuilderView.as_view(), name="smart-builder"),
    # Administración
    path("admin/dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
    path("admin/", include(admin_router.urls)),
    # Catálogo y armados guardados
    path("", include(router.urls)),
]