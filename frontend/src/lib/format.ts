import type { Product } from "@/types"

const CURRENCY = "PEN" 

const priceFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: CURRENCY,
})

export function formatPrice(value: string | number): string {
  return priceFormatter.format(Number(value))
}

// Prioriza la imagen subida; si no hay, usa la URL externa; si no, null
export function getProductImage(product: Product): string | null {
  return product.image || product.image_url || null
}

// "ram_type" -> "Ram type"
export function formatSpecKey(key: string): string {
  const text = key.replace(/_/g, " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatSpecValue(value: string | number | boolean): string {
  if (typeof value === "boolean") return value ? "Sí" : "No"
  return String(value)
}