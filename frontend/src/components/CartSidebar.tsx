import { ImageOff, Lock, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react"
import { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"

import { useCart } from "@/context/useCart"
import { formatPrice } from "@/lib/format"

interface CartSidebarProps {
  open: boolean
  onClose: () => void
}

export default function CartSidebar({ open, onClose }: CartSidebarProps) {
  const { cart, totalItems, updateQuantity, removeFromCart, getCartTotal } = useCart()
  const navigate = useNavigate()

  // Escape cierra el panel y el scroll de la página se bloquea mientras está abierto
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  const goTo = (path: string) => {
    onClose()
    navigate(path)
  }

  return (
    <div
      className={`fixed inset-0 z-[60] ${
        open ? "visible" : "invisible transition-[visibility] delay-300"
      }`}
      aria-hidden={!open}
    >
      {/* Fondo oscuro */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel (glassmorphism) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-purple-700/40 bg-black/70 shadow-[-12px_0_60px_rgb(139_47_232/0.25)] backdrop-blur-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

        {/* Cabecera */}
        <header className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple-500">
              Sistema de compra
            </p>
            <h2 className="mt-0.5 text-xl font-bold text-gray-100">
              Tu <span className="text-metal">Carrito</span>
              {totalItems > 0 && (
                <span className="ml-2 text-sm font-normal text-zinc-500">({totalItems})</span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-purple-500"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {cart.length === 0 ? (
          /* Carrito vacío */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <ShoppingBag className="h-14 w-14 text-zinc-700" />
            <p className="text-zinc-400">Tu carrito está vacío.</p>
            <button
              type="button"
              onClick={() => goTo("/catalog")}
              className="rounded-md border border-purple-600 bg-black px-5 py-2.5 font-semibold text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300"
            >
              Explorar catálogo
            </button>
          </div>
        ) : (
          <>
            {/* Lista */}
            <ul className="flex-1 space-y-3 overflow-y-auto px-5 pb-4">
              {cart.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-950">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <ImageOff className="h-6 w-6 text-zinc-700" />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-medium text-gray-100">
                        {item.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Eliminar ${item.name}`}
                        className="shrink-0 text-zinc-500 transition-colors hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center rounded-md border border-zinc-700 bg-black/60">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Disminuir cantidad"
                          className="p-1.5 text-gray-300 transition-colors hover:text-purple-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-gray-300"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-gray-100">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          aria-label="Aumentar cantidad"
                          className="p-1.5 text-gray-300 transition-colors hover:text-purple-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-gray-300"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="text-sm font-bold text-gray-100">
                        {formatPrice(Number(item.price) * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pie: total y pago */}
            <footer className="border-t border-purple-700/30 bg-black/40 p-5">
              <div className="flex items-end justify-between">
                <span className="text-zinc-400">Total a pagar</span>
                <span className="text-metal text-3xl font-bold">
                  {formatPrice(getCartTotal())}
                </span>
              </div>

              <button
                type="button"
                onClick={() => goTo("/checkout")}
                className="bg-metal glow-purple mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-lg font-bold text-white"
              >
                <Lock className="h-5 w-5" />
                Procesar Pago Seguro
              </button>

              <Link
                to="/cart"
                onClick={onClose}
                className="mt-3 block text-center text-sm text-zinc-500 transition-colors hover:text-purple-500"
              >
                Ver carrito completo
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}