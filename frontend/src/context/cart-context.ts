import { createContext } from "react"

import type { CartItem, CartQuoteCoupon, Product } from "@/types"

// Resultado de comparar el carrito con los precios y el stock vigentes del servidor
export interface CartSyncResult {
  ok: boolean // false si no se pudo consultar al servidor
  priceChanged: boolean // algún precio cambió respecto a lo que veía el cliente
  removed: string[] // productos retirados (ya no disponibles o sin stock)
  adjusted: string[] // productos cuya cantidad se ajustó por falta de stock
  couponRemoved: string | null // código del cupón que se quitó por dejar de servir
}

// Resultado de aplicar un cupón que escribió el cliente
export interface CouponApplyResult {
  ok: boolean
  message: string // motivo si no se pudo aplicar; "" si se aplicó
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
  coupon: CartQuoteCoupon | null
  applyCoupon: (code: string) => Promise<CouponApplyResult>
  removeCoupon: () => void
  getCouponDiscount: () => number
  getPayableTotal: () => number
}

export const CartContext = createContext<CartContextValue | null>(null)