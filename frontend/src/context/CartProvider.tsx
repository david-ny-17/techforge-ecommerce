import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

import { getProductImage } from "@/lib/format"
import type { CartItem, Product } from "@/types"

import { CartContext } from "./cart-context"
import type { CartContextValue } from "./cart-context"

const STORAGE_KEY = "techforge_cart"

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === "number" &&
    typeof v.slug === "string" &&
    typeof v.name === "string" &&
    typeof v.price === "string" &&
    typeof v.stock === "number" &&
    typeof v.quantity === "number" &&
    v.quantity > 0
  )
}

// Lee el carrito guardado; si está corrupto o no existe, devuelve []
function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : []
  } catch {
    return []
  }
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(loadCart)

  // Persistencia: sobrevive a F5
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    } catch {
      // Si el almacenamiento falla, el carrito sigue funcionando en memoria
    }
  }, [cart])

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)

      if (existing) {
        const newQuantity = Math.min(existing.quantity + quantity, product.stock)
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: newQuantity, stock: product.stock, price: product.price }
            : item
        )
      }

      const initialQuantity = Math.min(quantity, product.stock)
      if (initialQuantity < 1) return prev

      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: getProductImage(product),
          stock: product.stock,
          quantity: initialQuantity,
        },
      ]
    })
  }, [])

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: number, newQuantity: number) => {
    setCart((prev) => {
      if (newQuantity < 1) return prev.filter((item) => item.id !== productId)
      return prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.min(newQuantity, item.stock) }
          : item
      )
    })
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  // Se calcula en centavos para evitar errores de coma flotante (0.1 + 0.2)
  const getCartTotal = useCallback(
    () =>
      cart.reduce(
        (sum, item) => sum + Math.round(Number(item.price) * 100) * item.quantity,
        0
      ) / 100,
    [cart]
  )

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  )

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      totalItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
    }),
    [cart, totalItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}