import { KeyRound } from "lucide-react"
import { useNavigate } from "react-router-dom"

import ChangePasswordForm from "@/components/ChangePasswordForm"
import { useAuth } from "@/context/useAuth"

export default function ChangePassword() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  // true cuando es el cambio obligatorio de la contraseña temporal
  const forced = user.must_change_password

  const handleDone = () => navigate(user.is_staff ? "/admin" : "/profile", { replace: true })

  const handleLogout = () => {
    navigate("/login")
    logout()
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-8 shadow-[0_0_40px_rgb(139_47_232/0.08)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-purple-600 bg-purple-900/20 shadow-[0_0_28px_rgb(139_47_232/0.4)]">
          <KeyRound className="h-7 w-7 text-purple-400" />
        </div>

        <h1 className="mt-4 text-center text-3xl font-bold">
          Cambiar <span className="text-metal">contraseña</span>
        </h1>

        {forced ? (
          <p
            role="status"
            className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200"
          >
            Por seguridad, debes elegir una contraseña nueva antes de continuar. La que recibiste
            es temporal.
          </p>
        ) : (
          <p className="mt-2 text-center text-sm text-zinc-500">
            Elige una contraseña nueva para tu cuenta.
          </p>
        )}

        <div className="mt-6">
          <ChangePasswordForm
            onDone={handleDone}
            onCancel={forced ? undefined : () => navigate("/profile")}
          />
        </div>

        {forced && (
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 block w-full text-center text-sm text-zinc-500 transition-colors hover:text-purple-400"
          >
            Cerrar sesión
          </button>
        )}
      </div>
    </section>
  )
}