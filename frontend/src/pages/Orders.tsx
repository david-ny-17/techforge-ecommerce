import axios from "axios"
import { ChevronLeft, ChevronRight, Loader2, MapPin, PackageOpen } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { formatPrice } from "@/lib/format"
import { getOrders } from "@/services/api"
import type { Order, OrderStatus } from "@/types"

// Debe coincidir con PAGE_SIZE en backend/settings.py
const PAGE_SIZE = 12

const STATUS_STYLES: Record<OrderStatus, { label: string; className: string }> = {
  PAID: {
    label: "Pagado",
    className: "border-purple-600 bg-purple-900/20 text-purple-300",
  },
  FAILED: {
    label: "Fallido",
    className: "border-red-900/60 bg-red-950/30 text-red-300",
  },
  PENDING: {
    label: "Pendiente",
    className: "border-zinc-700 bg-zinc-900 text-zinc-300",
  },
}

interface OrdersResult {
  key: string // identifica a qué consulta (página|intento) pertenece este resultado
  orders: Order[]
  total: number
  hasNext: boolean
  hasPrev: boolean
  error: string | null
  outOfRange: boolean
}

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Math.floor(Number(searchParams.get("page"))) || 1)

  // Sube al pulsar "Reintentar" para volver a pedir los datos
  const [attempt, setAttempt] = useState(0)
  const queryKey = `${page}|${attempt}`

  const [result, setResult] = useState<OrdersResult | null>(null)

  // "Cargando" = el último resultado guardado no corresponde a la consulta actual
  const loading = result?.key !== queryKey

  useEffect(() => {
    let cancelled = false

    getOrders(page)
      .then((data) => {
        if (cancelled) return
        setResult({
          key: queryKey,
          orders: data.results,
          total: data.count,
          hasNext: data.next !== null,
          hasPrev: data.previous !== null,
          error: null,
          outOfRange: false,
        })
      })
      .catch((err) => {
        if (cancelled) return
        // DRF responde 404 cuando se pide una página que no existe
        const outOfRange = axios.isAxiosError(err) && err.response?.status === 404
        setResult({
          key: queryKey,
          orders: [],
          total: 0,
          hasNext: false,
          hasPrev: false,
          error: outOfRange
            ? "Esa página no existe."
            : "No se pudieron cargar tus pedidos. Verifica que el servidor esté activo.",
          outOfRange,
        })
      })

    return () => {
      cancelled = true
    }
  }, [page, queryKey])

  const goToPage = (target: number) => {
    const next = new URLSearchParams(searchParams)
    if (target <= 1) next.delete("page")
    else next.set("page", String(target))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const total = result?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          Mis <span className="text-metal">Pedidos</span>
        </h1>
        {!loading && !result?.error && total > 0 && (
          <p className="mt-1 text-sm text-zinc-500">
            {total} {total === 1 ? "pedido" : "pedidos"}
          </p>
        )}
      </header>

      {loading && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p>Cargando tus pedidos...</p>
        </div>
      )}

      {!loading && result?.error && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
          <p>{result.error}</p>
          <button
            type="button"
            onClick={() => (result.outOfRange ? goToPage(1) : setAttempt((n) => n + 1))}
            className="mt-3 rounded-md border border-purple-600 bg-black px-4 py-2 font-semibold text-purple-400 transition-colors hover:bg-purple-900/20"
          >
            {result.outOfRange ? "Ir a la primera página" : "Reintentar"}
          </button>
        </div>
      )}

      {!loading && result && !result.error && result.orders.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <PackageOpen className="h-14 w-14 text-zinc-700" />
          <p className="text-zinc-400">Aún no tienes pedidos.</p>
          <Link
            to="/catalog"
            className="bg-metal glow-purple rounded-lg px-6 py-3 font-bold text-white"
          >
            Explorar el catálogo
          </Link>
        </div>
      )}

      {!loading && result && result.orders.length > 0 && (
        <>
          <div className="space-y-6">
            {result.orders.map((order) => {
              const status = STATUS_STYLES[order.status]
              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
                >
                  <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900 px-5 py-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wider text-purple-500">
                        Pedido #{order.id}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(order.created_at).toLocaleString("es-PE")}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </header>

                  <ul className="divide-y divide-zinc-800 px-5">
                    {order.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-4 py-3 text-sm"
                      >
                        <Link
                          to={`/product/${item.product_slug}`}
                          className="min-w-0 flex-1 truncate text-gray-100 transition-colors hover:text-purple-400"
                        >
                          {item.quantity} × {item.product_name}
                        </Link>
                        <span className="font-medium text-gray-100">
                          {formatPrice(item.subtotal)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-end justify-between border-t border-zinc-800 px-5 py-4">
                    <span className="text-zinc-400">
                      {order.status === "PAID" ? "Total pagado" : "Total"}
                    </span>
                    <span className="text-metal text-2xl font-bold">
                      {formatPrice(order.total)}
                    </span>
                  </div>

                  {order.status === "FAILED" && (
                    <p className="border-t border-zinc-800 px-5 py-3 text-xs text-red-300">
                      El pago fue rechazado: no se realizó ningún cobro.
                    </p>
                  )}

                  {order.shipping_address && (
                    <div className="flex items-start gap-2 border-t border-zinc-800 px-5 py-4 text-sm">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                      <p className="text-zinc-400">
                        {order.shipping_address}, {order.shipping_city}
                      </p>
                    </div>
                  )}
                </article>
              )
            })}
          </div>

          {/* Paginación */}
          <nav
            aria-label="Paginación"
            className="mt-10 flex items-center justify-between gap-4 border-t border-zinc-800 pt-6"
          >
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={!result.hasPrev}
              className="inline-flex items-center gap-1 rounded-md border border-purple-600 bg-black px-4 py-2 text-sm font-semibold text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600 disabled:hover:bg-black"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            <span className="text-sm text-zinc-500">
              Página <span className="font-semibold text-gray-100">{page}</span> de {totalPages}
            </span>

            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={!result.hasNext}
              className="inline-flex items-center gap-1 rounded-md border border-purple-600 bg-black px-4 py-2 text-sm font-semibold text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600 disabled:hover:bg-black"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </>
      )}
    </section>
  )
}