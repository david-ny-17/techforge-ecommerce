from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from .serializers import UserSerializer


class ChangePasswordThrottle(UserRateThrottle):
    """Máximo 5 intentos por minuto y por usuario: evita adivinar la contraseña actual."""

    scope = "change_password"
    rate = "5/min"


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password2 = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña actual no es correcta.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user

        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password2": "Las contraseñas no coinciden."})
        if attrs["new_password"] == attrs["current_password"]:
            raise serializers.ValidationError(
                {"new_password": "La nueva contraseña debe ser distinta de la actual."}
            )

        # Reglas de AUTH_PASSWORD_VALIDATORS (longitud, contraseñas comunes, solo números...)
        try:
            validate_password(attrs["new_password"], user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"new_password": list(exc.messages)}) from exc
        return attrs


class ChangePasswordView(APIView):
    """Cambia la contraseña del usuario autenticado y apaga el cambio obligatorio."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [ChangePasswordThrottle]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])

        # Se devuelve el usuario actualizado para que el frontend refresque su estado
        return Response({"detail": "Contraseña actualizada.", "user": UserSerializer(user).data})