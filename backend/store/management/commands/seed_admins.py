from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import identify_hasher
from django.core.management.base import BaseCommand, CommandError

from ._admins_data import ADMINS


class Command(BaseCommand):
    help = "Crea (o actualiza) las cuentas de administrador del equipo. Se puede repetir sin problema."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset-passwords",
            action="store_true",
            help="Vuelve a poner la contraseña original de cada administrador existente "
            "(y le obliga a cambiarla otra vez).",
        )
        parser.add_argument(
            "--require-password-change",
            action="store_true",
            help="Obliga a los administradores existentes a cambiar su contraseña en el próximo "
            "inicio de sesión, sin tocar la contraseña que tengan ahora.",
        )

    def handle(self, *args, **options):
        User = get_user_model()
        reset = options["reset_passwords"]
        require_change = options["require_password_change"]

        for item in ADMINS:
            email = item["email"].strip().lower()

            try:
                identify_hasher(item["password_hash"])
            except ValueError as exc:
                raise CommandError(f"El hash de {email} no es válido: {exc}") from exc

            user = (
                User.objects.filter(username__iexact=email).first()
                or User.objects.filter(email__iexact=email).first()
            )
            created = user is None
            if created:
                user = User(username=email, email=email)

            user.first_name = item["first_name"]
            user.last_name = item["last_name"]
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True

            # La contraseña solo se fija al crear la cuenta (o con --reset-passwords),
            # para no pisar la que el administrador haya cambiado después.
            if created or reset:
                user.password = item["password_hash"]
            # La contraseña de ADMINS es temporal: quien entra con ella debe elegir una propia.
            if created or reset or require_change:
                user.must_change_password = True
            user.save()

            if created:
                self.stdout.write(self.style.SUCCESS(f"Creado: {email} (deberá cambiar su contraseña al entrar)"))
            elif reset:
                self.stdout.write(self.style.WARNING(f"Contraseña restablecida y cambio obligatorio activado: {email}"))
            elif require_change:
                self.stdout.write(self.style.WARNING(f"Cambio de contraseña obligatorio activado: {email}"))
            else:
                self.stdout.write(f"Ya existía (sin cambios): {email}")