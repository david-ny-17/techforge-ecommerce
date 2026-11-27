import { createContext } from "react"

import type { CartItem, Product } from "@/types"

// Resultado de comparar el carrito con los precios y el stock vigentes del servidor
export interface CartSyncResult {
  ok: boolean // false si no se pudo consultar al servidor
  priceChanged: boolean // algún precio cambió respecto a lo que veía el cliente
  removed: string[] // productos retirados (ya no disponibles o sin stock)
  adjusted: string[] // productos cuya cantidad se ajustó por falta de stock
}

export interface CartContextValue {
  cart: CartItem[]
  totalItems: number
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, newQuantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartSavings: () => number
  syncCart: () => Promise<CartSyncResult>
  cartNotice: string | null
  dismissCartNotice: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)