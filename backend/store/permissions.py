from rest_framework.permissions import BasePermission


class IsStoreAdmin(BasePermission):
    """Administrador de la tienda: is_staff y con la contraseña inicial ya cambiada.

    Mientras el administrador no cambie la contraseña temporal que le entregaron, el
    servidor le niega todo el panel (no basta con ocultar pantallas en el frontend).
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.is_staff):
            self.message = "No tienes permiso para realizar esta acción."
            return False
        if getattr(user, "must_change_password", False):
            self.message = "Debes cambiar tu contraseña inicial antes de usar el panel."
            return False
        return True