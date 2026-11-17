import { Eye, Loader2, Search } from "lucide-react"
import { useState } from "react"

import Badge from "@/components/admin/Badge"
import GlassCard from "@/components/admin/GlassCard"
import OrderDetailModal from "@/components/admin/OrderDetailModal"
import Pagination from "@/components/admin/Pagination"
import { formatDateTime, isFresh, ORDER_STATUS, timeAgo } from "@/lib/admin-format"
import { INPUT_CLASS, SELECT_CLASS } from "@/lib/admin-styles"
import { formatPrice } from "@/lib/format"
import { useDebouncedValue } from "@/lib/use-debounce"
import { usePolling } from "@/lib/use-polling"
import { getAdminOrders } from "@/services/admin-api"
import type { AdminOrder } from "@/types"

const PAGE_SIZE = 12 // igual que el backend (AdminPagination)
const POLL_MS = 5000

const ORDERINGS = [
  { value: "-created_at", label: "Más recientes" },
  { value: "created_at", label: "Más antiguos" },
  { value: "-total", label: "Mayor total" },
  { value: "total", label: "Menor total" },
]

export default function AdminOrders() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [ordering, setOrdering] = useState("-created_at")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AdminOrder | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const query = { page, search: debouncedSearch, status, ordering }
  const { data, error, loading, lastUpdated } = usePolling(
    () => getAdminOrders(query),
    POLL_MS,
    JSON.stringify(query)
  )

  const rows = data?.results ?? []
  const now = lastUpdated ? lastUpdated.getTime() : 0
  // El detalle abierto se mantiene al día con cada consulta (por ejemplo, Pendiente -> Pagado)
  const openOrder = selected ? (rows.find((order) => order.id === selected.id) ?? selected) : null

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            <span className="text-metal">Pedidos</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {data ? `${data.count} pedidos` : "Cargando..."} · los nuevos aparecen solos.
          </p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-400 backdrop-blur">
          <span
            className={`h-2 w-2 rounded-full ${error ? "bg-red-500" : "animate-pulse bg-emerald-400"}`}
          />
          {error
            ? "Sin conexión · reintentando"
            : lastUpdated
              ? `En vivo · ${lastUpdated.toLocaleTimeString("es-PE")}`
              : "Conectando..."}
        </div>
      </header>

      {/* Filtros */}
      <GlassCard className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr]">
        <div className="relative sm:col-span-2 xl:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            aria-label="Buscar pedidos"
            placeholder="Buscar por cliente, correo o ciudad..."
            className={`${INPUT_CLASS} pl-9`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <select
          aria-label="Filtrar por estado"
          className={SELECT_CLASS}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Todos los estados</option>
          <option value="PAID">Pagados</option>
          <option value="PENDING">Pendientes</option>
          <option value="FAILED">Fallidos</option>
        </select>

        <select
          aria-label="Ordenar por"
          className={SELECT_CLASS}
          value={ordering}
          onChange={(e) => {
            setOrdering(e.target.value)
            setPage(1)
          }}
        >
          {ORDERINGS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </GlassCard>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300"
        >
          No se pudo cargar la lista. Se reintenta solo.
        </div>
      )}

      {/* Tabla */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Ciudad</th>
                <th className="px-4 py-3 font-medium">Artículos</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && !data && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-purple-500" />
                  </td>
                </tr>
              )}

              {data && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                    No hay pedidos con esos filtros.
                  </td>
                </tr>
              )}

              {rows.map((order) => {
                const orderStatus = ORDER_STATUS[order.status]
                const fresh = isFresh(order.created_at, now)
                return (
                  <tr
                    key={order.id}
                    className={`transition-colors hover:bg-white/[0.03] ${
                      fresh ? "bg-purple-500/[0.07]" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      #{order.id}
                      {fresh && (
                        <span className="ml-2">
                          <Badge tone="purple">Nuevo</Badge>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[14rem] truncate font-medium">{order.customer.name}</p>
                      <p className="max-w-[14rem] truncate text-xs text-zinc-500">
                        {order.customer.email}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-300">
                      {formatDateTime(order.created_at)}
                      <p className="text-xs text-zinc-500">{timeAgo(order.created_at, now)}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{order.shipping_city || "—"}</td>
                    <td className="px-4 py-3 text-zinc-300">{order.items_count}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={orderStatus.tone}>{orderStatus.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        aria-label={`Ver detalle del pedido ${order.id}`}
                        title="Ver detalle"
                        onClick={() => setSelected(order)}
                        className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-purple-300"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <Pagination page={page} count={data?.count ?? 0} pageSize={PAGE_SIZE} onChange={setPage} />
      </GlassCard>

      {openOrder && <OrderDetailModal order={openOrder} onClose={() => setSelected(null)} />}
    </div>
  )
}