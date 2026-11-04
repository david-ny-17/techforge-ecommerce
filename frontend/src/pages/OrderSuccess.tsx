import { CheckCircle2 } from "lucide-react"
import { Link, Navigate, useLocation } from "react-router-dom"

import { formatPrice } from "@/lib/format"
import type { Order } from "@/types"

interface SuccessState {
  order?: Order
  shipping?: { address: string; city: string }
}

export default function OrderSuccess() {
  const state = useLocation().state as SuccessState | null
  const order = state?.order
  const shipping = state?.shipping

  // Si se entra directo a la URL (sin haber pagado), no hay nada que mostrar
  if (!order) return <Navigate to="/" replace />

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-10 text-center">
      <div className="flex h-28 w-28 items-center justify-center rounded-full border border-purple-600 bg-purple-900/20 shadow-[0_0_48px_rgb(139_47_232/0.45)]">
        <CheckCircle2 className="h-16 w-16 text-purple-400" />
      </div>

      <h1 className="mt-8 text-4xl font-bold">
        ¡Pago <span className="text-metal">procesado</span>!
      </h1>
      <p className="mt-2 text-zinc-400">Tu pedido está en camino.</p>

      <div className="mt-8 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-left">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-5 py-3">
          <span className="text-sm font-semibold uppercase tracking-wider text-purple-500">
            Pedido #{order.id}
          </span>
          <span className="text-xs text-zinc-500">
            {new Date(order.created_at).toLocaleString("es-PE")}
          </span>
        </div>

        <ul className="divide-y divide-zinc-800 px-5">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span className="min-w-0 flex-1 truncate text-gray-100">
                {item.quantity} × {item.product_name}
              </span>
              <span className="font-medium text-gray-100">{formatPrice(item.subtotal)}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-end justify-between border-t border-zinc-800 px-5 py-4">
          <span className="text-zinc-400">Total pagado</span>
          <span className="text-metal text-2xl font-bold">{formatPrice(order.total)}</span>
        </div>

        {shipping && (
          <div className="border-t border-zinc-800 px-5 py-4 text-sm">
            <p className="text-zinc-500">Enviaremos tu pedido a:</p>
            <p className="mt-1 text-gray-100">
              {shipping.address}, {shipping.city}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
        <Link
          to="/"
          className="bg-metal glow-purple flex-1 rounded-lg px-6 py-3 font-bold text-white"
        >
          Volver al inicio
        </Link>
        <Link
          to="/catalog"
          className="flex-1 rounded-lg border border-purple-600 bg-black px-6 py-3 font-semibold text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300"
        >
          Seguir comprando
        </Link>
      </div>
    </section>
  )
}