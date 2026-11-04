import { Loader2 } from "lucide-react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/context/useAuth"

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Mientras se valida el token guardado no se redirige (evita un rebote falso a /login)
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!user) {
    // `state.from` permite volver aquí después de iniciar sesión
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}