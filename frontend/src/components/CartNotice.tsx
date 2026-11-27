import { Info, X } from "lucide-react"

import { useCart } from "@/context/useCart"

// Aviso cuando el carrito se corrigió con los precios, ofertas y stock vigentes del servidor.
// No pinta nada si no hay aviso. Se cierra con la X o al vaciar el carrito.
export default function CartNotice({ className = "" }: { className?: string }) {
  const { cartNotice, dismissCartNotice } = useCart()

  if (!cartNotice) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-lg border border-purple-700/50 bg-purple-900/10 p-3 text-sm text-purple-200 ${className}`}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
      <p className="flex-1">{cartNotice}</p>
      <button
        type="button"
        onClick={dismissCartNotice}
        aria-label="Cerrar aviso"
        className="shrink-0 text-purple-300 transition-colors hover:text-purple-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}