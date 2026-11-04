import { createContext } from "react"

import type { CartItem, Product } from "@/types"

export interface CartContextValue {
  cart: CartItem[]
  totalItems: number
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, newQuantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
}

export const CartContext = createContext<CartContextValue | null>(null)