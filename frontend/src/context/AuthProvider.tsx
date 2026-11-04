import axios from "axios"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

import {
  AUTH_LOGOUT_EVENT,
  clearTokens,
  getAccessToken,
  saveTokens,
} from "@/lib/auth-storage"
import { getProfile, loginRequest, registerRequest } from "@/services/api"
import type { RegisterData, User } from "@/types"

import { AuthContext } from "./auth-context"
import type { AuthContextValue } from "./auth-context"

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(getAccessToken)
  // Si hay token guardado, hay que validarlo antes de decidir si hay sesión
  const [loading, setLoading] = useState(() => getAccessToken() !== null)

  // Restaurar la sesión al cargar la página (F5)
  useEffect(() => {
    if (!getAccessToken()) return
    let cancelled = false

    getProfile()
      .then((profile) => {
        if (!cancelled) setUser(profile)
      })
      .catch((err) => {
        if (cancelled) return
        // Si el servidor respondió con error, la sesión no es válida: se limpia.
        // Si no respondió (servidor apagado), se conservan los tokens.
        if (axios.isAxiosError(err) && err.response) clearTokens()
        setToken(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // El interceptor avisa cuando el refresh falla y la sesión expiró
  useEffect(() => {
    const handler = () => {
      setUser(null)
      setToken(null)
    }
    window.addEventListener(AUTH_LOGOUT_EVENT, handler)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handler)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const tokens = await loginRequest(username, password)
    saveTokens(tokens.access, tokens.refresh)
    setToken(tokens.access)
    try {
      setUser(await getProfile())
    } catch (err) {
      clearTokens()
      setToken(null)
      setUser(null)
      throw err
    }
  }, [])

  const register = useCallback(
    async (data: RegisterData) => {
      await registerRequest(data)
      await login(data.username, data.password) // login automático
    },
    [login]
  )

  const logout = useCallback(() => {
    clearTokens()
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}