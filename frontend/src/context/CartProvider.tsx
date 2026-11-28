import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"

import { getProductImage } from "@/lib/format"
import { getCartQuote } from "@/services/api"
import type { CartItem, CartQuote, CartQuoteCoupon, Product } from "@/types"

import { CartContext } from "./cart-context"
import type { CartContextValue, CartSyncResult, CouponApplyResult } from "./cart-context"

const STORAGE_KEY = "techforge_cart"
const COUPON_KEY = "techforge_coupon"

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

function isCoupon(value: unknown): value is CartQuoteCoupon {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.code === "string" &&
    v.code !== "" &&
    typeof v.label === "string" &&
    typeof v.description === "string" &&
    typeof v.discount === "string"
  )
}

// Lee el cupón guardado; si está corrupto o no existe, devuelve null
function loadCoupon(): CartQuoteCoupon | null {
  try {
    const raw = localStorage.getItem(COUPON_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isCoupon(parsed) ? parsed : null
  } catch {
    return null
  }
}

const EMPTY_SYNC: CartSyncResult = {
  ok: true,
  priceChanged: false,
  removed: [],
  adjusted: [],
  couponRemoved: null,
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

  const [coupon, setCoupon] = useState<CartQuoteCoupon | null>(loadCoupon)

  // Igual que cartRef: el cupón más reciente, para usarlo dentro de funciones estables
  const couponRef = useRef(coupon)
  useEffect(() => {
    couponRef.current = coupon
  }, [coupon])

  // Persistencia del cupón: sobrevive a F5 (se revalida solo en cada sincronización)
  useEffect(() => {
    try {
      if (coupon) localStorage.setItem(COUPON_KEY, JSON.stringify(coupon))
      else localStorage.removeItem(COUPON_KEY)
    } catch {
      // Si el almacenamiento falla, el cupón sigue funcionando en memoria
    }
  }, [coupon])

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
    setCoupon(null)
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

  const removeCoupon = useCallback(() => setCoupon(null), [])

  // Lo que descuenta el cupón (el servidor lo calcula sobre el subtotal ya con ofertas)
  const getCouponDiscount = useCallback(
    () => (coupon ? Math.round(Number(coupon.discount) * 100) / 100 : 0),
    [coupon]
  )

  // Lo que realmente se paga: ofertas + cupón
  const getPayableTotal = useCallback(() => {
    const cents = Math.round(getCartTotal() * 100) - Math.round(getCouponDiscount() * 100)
    return Math.max(0, cents) / 100
  }, [getCartTotal, getCouponDiscount])

  const dismissCartNotice = useCallback(() => setCartNotice(null), [])

  // Aplica una cotización del servidor al carrito: precios, ofertas y stock vigentes.
  // Se aplica sobre el carrito más reciente: no pisa cambios hechos mientras se esperaba.
  const reconcileCart = useCallback((snapshot: CartItem[], quote: CartQuote): CartSyncResult => {
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

    return { ok: true, priceChanged, removed, adjusted, couponRemoved: null }
  }, [])

  // Compara el carrito (y el cupón) con los precios, el stock y las ofertas VIGENTES del
  // servidor y lo corrige. Devuelve qué cambió (el checkout lo usa antes de cobrar).
  const syncCart = useCallback(async (): Promise<CartSyncResult> => {
    const snapshot = cartRef.current
    if (snapshot.length === 0) return EMPTY_SYNC

    const sentCode = couponRef.current?.code
    let quote: CartQuote
    try {
      quote = await getCartQuote(
        snapshot.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        sentCode
      )
    } catch {
      // Sin conexión con el servidor: el carrito se conserva tal cual
      return { ...EMPTY_SYNC, ok: false }
    }

    const base = reconcileCart(snapshot, quote)
    let message = noticeFrom(base)
    let couponRemoved: string | null = null

    // El cupón también se revalida. Solo se toca si sigue siendo el mismo que se envió
    // (el cliente pudo quitarlo o cambiarlo mientras se esperaba la respuesta).
    if (sentCode && couponRef.current?.code === sentCode) {
      if (quote.coupon) {
        setCoupon(quote.coupon)
      } else {
        setCoupon(null)
        couponRemoved = sentCode
        const reason = quote.coupon_error ?? "ya no es válido."
        message = [`Quitamos el cupón ${sentCode}: ${reason}`, message]
          .filter(Boolean)
          .join(" ")
      }
    }

    if (message) setCartNotice(message)
    return { ...base, couponRemoved }
  }, [reconcileCart])

  // El cliente escribió un cupón: se comprueba con el servidor y, si sirve, se aplica.
  // Si no, se devuelve el motivo para mostrarlo junto al campo (no como aviso general).
  const applyCoupon = useCallback(
    async (rawCode: string): Promise<CouponApplyResult> => {
      const code = rawCode.trim()
      if (!code) return { ok: false, message: "Escribe un código de cupón." }

      const snapshot = cartRef.current
      if (snapshot.length === 0) {
        return { ok: false, message: "Añade productos al carrito para usar un cupón." }
      }

      let quote: CartQuote
      try {
        quote = await getCartQuote(
          snapshot.map((item) => ({ product_id: item.id, quantity: item.quantity })),
          code
        )
      } catch {
        return {
          ok: false,
          message: "No se pudo comprobar el cupón. Revisa tu conexión e inténtalo de nuevo.",
        }
      }

      const notice = noticeFrom(reconcileCart(snapshot, quote))
      if (notice) setCartNotice(notice)

      if (!quote.coupon) {
        return { ok: false, message: quote.coupon_error ?? "No se pudo aplicar el cupón." }
      }
      setCoupon(quote.coupon)
      return { ok: true, message: "" }
    },
    [reconcileCart]
  )

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
      coupon,
      applyCoupon,
      removeCoupon,
      getCouponDiscount,
      getPayableTotal,
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
      coupon,
      applyCoupon,
      removeCoupon,
      getCouponDiscount,
      getPayableTotal,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}