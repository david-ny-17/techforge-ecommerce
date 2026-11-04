import axios from "axios"

import type { PaginatedResponse, Product } from "@/types"

export const api = axios.create({
  baseURL: "http://localhost:8000/api/",
  headers: { "Content-Type": "application/json" },
})

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