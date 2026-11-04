import axios from "axios"
import type { AxiosError, InternalAxiosRequestConfig } from "axios"

import {
  AUTH_LOGOUT_EVENT,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "@/lib/auth-storage"
import type {
  AuthTokens,
  CheckoutPayload,
  CheckoutResponse,
  PaginatedResponse,
  Product,
  RegisterData,
  User,
} from "@/types"

const API_URL = "http://localhost:8000/api/"

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
})

// Estos endpoints nunca deben llevar el token (un token vencido haría fallar el registro)
const AUTH_ENDPOINTS = ["auth/login/", "auth/register/", "auth/refresh/"]
const isAuthEndpoint = (url = "") => AUTH_ENDPOINTS.some((path) => url.includes(path))

// ---------- Interceptor de petición: adjunta el token ----------
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token && !isAuthEndpoint(config.url)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---------- Interceptor de respuesta: renueva el token si venció ----------
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let refreshPromise: Promise<void> | null = null

async function refreshAccessToken(): Promise<void> {
  const refresh = getRefreshToken()
  if (!refresh) throw new Error("No hay refresh token")
  // Se usa axios "plano" (no `api`) para no activar los interceptores otra vez
  const { data } = await axios.post<{ access: string; refresh?: string }>(
    `${API_URL}auth/refresh/`,
    { refresh }
  )
  saveTokens(data.access, data.refresh)
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined

    if (
      !original ||
      error.response?.status !== 401 ||
      original._retry ||
      isAuthEndpoint(original.url) ||
      getRefreshToken() === null
    ) {
      return Promise.reject(error)
    }

    original._retry = true

    let refreshed = true
    try {
      // Si varias peticiones fallan a la vez, comparten un único refresh
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      await refreshPromise
    } catch {
      refreshed = false
    }

    if (refreshed) return api(original) // reintenta con el token nuevo

    // Refresh fallido: sesión expirada. Se limpia y se reintenta sin token
    // (así los endpoints públicos como el catálogo siguen funcionando).
    clearTokens()
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
    original.headers.delete("Authorization")
    return api(original)
  }
)

// ---------- Catálogo ----------
export async function getProducts(
  params?: Record<string, string | number | boolean>
): Promise<PaginatedResponse<Product>> {
  const { data } = await api.get<PaginatedResponse<Product>>("products/", { params })
  return data
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const { data } = await api.get<Product>(`products/${slug}/`)
  return data
}

// ---------- Autenticación ----------
export async function loginRequest(username: string, password: string): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("auth/login/", { username, password })
  return data
}

export async function registerRequest(payload: RegisterData): Promise<User> {
  const { data } = await api.post<User>("auth/register/", payload)
  return data
}

export async function getProfile(): Promise<User> {
  const { data } = await api.get<User>("auth/profile/")
  return data
}

export async function processCheckout(orderData: CheckoutPayload): Promise<CheckoutResponse> {
  const { data } = await api.post<CheckoutResponse>("checkout/", orderData)
  return data
}