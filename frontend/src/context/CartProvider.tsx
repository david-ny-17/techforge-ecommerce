import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"

import { getProductImage } from "@/lib/format"
import { getCartQuote } from "@/services/api"
import type { CartItem, CartQuote, Product } from "@/types"

import { CartContext } from "./cart-context"
import type { CartContextValue, CartSyncResult } from "./cart-context"

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

const EMPTY_SYNC: CartSyncResult = {
  ok: true,
  priceChanged: false,
  removed: [],
  adjusted: [],
}

// Mensaje para el cliente cuando la sincronización cambió algo de su carrito
function noticeFrom(result: CartSyncResult): string | null {
  const parts: string[] = []
  if (result.removed.length > 0) {
    parts.push(
      `Retiramos de tu carrito lo que ya no está disponible: ${result.removed.join(", ")}.`
    )
  }
  if (result.adjusted.length > 0) {
    parts.push(`Ajustamos la cantidad por falta de stock: ${result.adjusted.join(", ")}.`)
  }
  if (result.priceChanged) {
    parts.push("Actualizamos los precios de tu carrito a los vigentes.")
  }
  return parts.length > 0 ? parts.join(" ") : null
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(loadCart)

  const [cartNotice, setCartNotice] = useState<string | null>(null)

  // Siempre apunta al carrito más reciente (para usarlo dentro de funciones estables)
  const cartRef = useRef(cart)
  useEffect(() => {
    cartRef.current = cart
  }, [cart])

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
            ? {
                ...item,
                quantity: newQuantity,
                stock: product.stock,
                price: product.price,
                original_price: product.original_price,
                discount_percent: product.discount_percent,
              }
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
          original_price: product.original_price,
          discount_percent: product.discount_percent,
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

  const clearCart = useCallback(() => {
    setCart([])
    setCartNotice(null)
  }, [])

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
  
  // Lo que el cliente se ahorra gracias a las ofertas (precio de lista - precio final)
  const getCartSavings = useCallback(
    () =>
      cart.reduce((sum, item) => {
        const list = Math.round(Number(item.original_price ?? item.price) * 100)
        const paid = Math.round(Number(item.price) * 100)
        return sum + Math.max(0, list - paid) * item.quantity
      }, 0) / 100,
    [cart]
  )

  const dismissCartNotice = useCallback(() => setCartNotice(null), [])

  // Compara el carrito con los precios, el stock y las ofertas VIGENTES del servidor
  // y lo corrige. Devuelve qué cambió (el checkout lo usa antes de cobrar).
  const syncCart = useCallback(async (): Promise<CartSyncResult> => {
    const snapshot = cartRef.current
    if (snapshot.length === 0) return EMPTY_SYNC

    let quote: CartQuote
    try {
      quote = await getCartQuote(
        snapshot.map((item) => ({ product_id: item.id, quantity: item.quantity }))
      )
    } catch {
      // Sin conexión con el servidor: el carrito se conserva tal cual
      return { ...EMPTY_SYNC, ok: false }
    }

    const quoted = new Map(quote.items.map((q) => [q.product_id, q] as const))
    const unavailable = new Set(quote.unavailable)
    const removed: string[] = []
    const adjusted: string[] = []
    let priceChanged = false

    for (const item of snapshot) {
      const q = quoted.get(item.id)
      if (unavailable.has(item.id) || (q && q.stock < 1)) {
        removed.push(item.name)
        continue
      }
      if (!q) continue
      if (Number(q.price) !== Number(item.price)) priceChanged = true
      if (item.quantity > q.stock) adjusted.push(item.name)
    }

    // Se aplica sobre el carrito más reciente: no pisa cambios hechos mientras se esperaba
    setCart((prev) =>
      prev.flatMap((item) => {
        const q = quoted.get(item.id)
        if (unavailable.has(item.id) || (q && q.stock < 1)) return []
        if (!q) return [item]
        return [
          {
            ...item,
            price: q.price,
            original_price: q.original_price,
            discount_percent: q.discount_percent,
            stock: q.stock,
            quantity: Math.min(item.quantity, q.stock),
          },
        ]
      })
    )

    const result: CartSyncResult = { ok: true, priceChanged, removed, adjusted }
    const message = noticeFrom(result)
    if (message) setCartNotice(message)
    return result
  }, [])

  // Se vuelve a consultar solo cuando cambian los productos o las cantidades; los precios
  // actualizados no disparan otra consulta (no hay bucle).
  const signature = useMemo(
    () => cart.map((item) => `${item.id}:${item.quantity}`).join(","),
    [cart]
  )

  useEffect(() => {
    if (signature === "") return
    const timer = window.setTimeout(() => {
      void syncCart()
    }, 400)
    return () => window.clearTimeout(timer)
  }, [signature, syncCart])

  // Al volver a la pestaña, los precios pudieron cambiar mientras estabas fuera
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void syncCart()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [syncCart])

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      totalItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartSavings,
      syncCart,
      cartNotice,
      dismissCartNotice,
    }),
    [
      cart,
      totalItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartSavings,
      syncCart,
      cartNotice,
      dismissCartNotice,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}