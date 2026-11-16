import { Check, ShoppingCart } from "lucide-react"
import { Link } from "react-router-dom"

import { useCart } from "@/context/useCart"
import type { Product } from "@/types"

// Solo cuentan los productos con stock; y solo se añaden los que aún no están
// en el carrito (así, pulsar el botón dos veces no duplica cantidades).
export default function AddAllBar({ products }: { products: Product[] }) {
  const { cart, addToCart } = useCart()

  const availableProducts = products.filter((p) => p.stock > 0)
  const missingInCart = availableProducts.filter(
    (p) => !cart.some((item) => item.id === p.id)
  )
  const outOfStockCount = products.length - availableProducts.length
  const allInCart = availableProducts.length > 0 && missingInCart.length === 0

  const handleAddAll = () => {
    missingInCart.forEach((product) => addToCart(product, 1))
  }

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-800 bg-zinc-900/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div role="status" aria-live="polite" className="text-sm text-zinc-500">
        {allInCart ? (
          <span className="text-purple-400">
            Los {availableProducts.length} productos ya están en tu carrito.
          </span>
        ) : availableProducts.length === 0 ? (
          <span>Ningún producto tiene stock ahora mismo.</span>
        ) : (
          <span>Añade 1 unidad de cada producto con stock.</span>
        )}
        {outOfStockCount > 0 && availableProducts.length > 0 && (
          <span className="block text-xs text-zinc-600">
            {outOfStockCount === 1
              ? "1 producto sin stock no se añadirá."
              : `${outOfStockCount} productos sin stock no se añadirán.`}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {allInCart && (
          <Link
            to="/cart"
            className="rounded-lg border border-purple-600 bg-black px-4 py-2.5 text-sm font-semibold text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300"
          >
            Ir al carrito
          </Link>
        )}
        <button
          type="button"
          onClick={handleAddAll}
          disabled={availableProducts.length === 0 || allInCart}
          className="bg-metal glow-purple inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale"
        >
          {allInCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
          {allInCart ? "Todo está en el carrito" : "Añadir todo al carrito"}
        </button>
      </div>
    </div>
  )
}