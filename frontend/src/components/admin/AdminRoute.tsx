import { Loader2 } from "lucide-react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/context/useAuth"

export default function AdminRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Mientras se valida el token guardado no se decide nada (evita un rebote falso)
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  // Un cliente nunca ve el panel. (La seguridad real está en el backend: ahí cada
  // endpoint exige is_staff; esto solo evita mostrar pantallas que no le sirven.)
  if (!user.is_staff) return <Navigate to="/" replace />

  return <Outlet />
}