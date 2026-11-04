import { Check, ShoppingCart } from "lucide-react"
import { useEffect, useState } from "react"

import { useCart } from "@/context/useCart"
import type { Product } from "@/types"

interface AddToCartButtonProps {
  product: Product
  variant?: "icon" | "full"
}

export default function AddToCartButton({ product, variant = "full" }: AddToCartButtonProps) {
  const { cart, addToCart } = useCart()
  const [added, setAdded] = useState(false)

  // Feedback visual: el botón muestra "¡Añadido!" durante 1.5 s
  useEffect(() => {
    if (!added) return
    const timer = window.setTimeout(() => setAdded(false), 1500)
    return () => window.clearTimeout(timer)
  }, [added])

  const inCart = cart.find((item) => item.id === product.id)?.quantity ?? 0
  const outOfStock = product.stock === 0
  const maxReached = !outOfStock && inCart >= product.stock
  const disabled = (outOfStock || maxReached) && !added

  const label = added
    ? "¡Añadido!"
    : outOfStock
      ? "Sin stock"
      : maxReached
        ? "Máximo en carrito"
        : "Añadir al Carrito"

  const handleClick = () => {
    addToCart(product, 1)
    setAdded(true)
  }

  const Icon = added ? Check : ShoppingCart
  const disabledStyles =
    "disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale"

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={`bg-metal glow-purple flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white ${disabledStyles}`}
      >
        <Icon className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`bg-metal glow-purple flex items-center justify-center gap-2 rounded-lg px-6 py-4 text-lg font-semibold text-white ${disabledStyles}`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  )
}