import { api } from "@/services/api"
import type { AdminDashboardData, AdminProduct, PaginatedResponse } from "@/types"

// Quita los parámetros vacíos (si no, axios enviaría "search=" y similares)
function clean(params: Record<string, string | number | undefined>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  )
}

// ---------- Dashboard ----------
export async function getAdminDashboard(days = 30): Promise<AdminDashboardData> {
  const { data } = await api.get<AdminDashboardData>("admin/dashboard/", { params: { days } })
  return data
}

// ---------- Productos ----------
export type AdminProductQuery = {
  page?: number
  search?: string
  category?: string
  is_active?: string // "true" | "false"
  stock_lte?: string
  ordering?: string
}

export async function getAdminProducts(
  query: AdminProductQuery
): Promise<PaginatedResponse<AdminProduct>> {
  const { data } = await api.get<PaginatedResponse<AdminProduct>>("admin/products/", {
    params: clean(query),
  })
  return data
}

const MULTIPART = { headers: { "Content-Type": "multipart/form-data" }, timeout: 60000 }

// Se envía como FormData para poder subir la imagen junto con los demás datos
export async function createAdminProduct(form: FormData): Promise<AdminProduct> {
  const { data } = await api.post<AdminProduct>("admin/products/", form, MULTIPART)
  return data
}

export async function updateAdminProduct(id: number, form: FormData): Promise<AdminProduct> {
  const { data } = await api.patch<AdminProduct>(`admin/products/${id}/`, form, MULTIPART)
  return data
}

export interface DeleteProductResult {
  // true = el producto tenía pedidos, así que se desactivó en lugar de borrarse
  deactivated: boolean
  detail: string | null
}

export async function deleteAdminProduct(id: number): Promise<DeleteProductResult> {
  const { status, data } = await api.delete<unknown>(`admin/products/${id}/`)
  if (status === 204 || typeof data !== "object" || data === null) {
    return { deactivated: false, detail: null }
  }
  const body = data as { detail?: string; deactivated?: boolean }
  return { deactivated: body.deactivated === true, detail: body.detail ?? null }
}