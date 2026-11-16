import type { Product } from "@/types"

// Suma en centavos para evitar errores de coma flotante (0.1 + 0.2)
export const sumPrices = (products: Product[]) =>
  products.reduce((sum, p) => sum + Math.round(Number(p.price) * 100), 0) / 100

// Nombre sugerido para un armado guardado: la consulta del cliente, recortada
export function defaultBuildName(prompt: string): string {
  const clean = prompt.replace(/\s+/g, " ").trim()
  return clean.length > 60 ? `${clean.slice(0, 57)}...` : clean
}