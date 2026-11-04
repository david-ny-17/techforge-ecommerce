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
}

export const AuthContext = createContext<AuthContextValue | null>(null)