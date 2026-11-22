import { createContext } from "react"

import type { RegisterData, User } from "@/types"

export interface AuthContextValue {
  user: User | null
  token: string | null // informativo: las peticiones leen el token fresco desde el storage
  loading: boolean // true mientras se restaura la sesión al cargar la página
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  // Actualiza el usuario en memoria (tras editar el perfil o cambiar la contraseña)
  updateUser: (user: User) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)