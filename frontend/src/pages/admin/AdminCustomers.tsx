import { Check, Loader2, Search, UserCheck, UserX } from "lucide-react"
import { useEffect, useState } from "react"

import Badge from "@/components/admin/Badge"
import ConfirmModal from "@/components/admin/ConfirmModal"
import GlassCard from "@/components/admin/GlassCard"
import Pagination from "@/components/admin/Pagination"
import { formatDate, initials, isFresh, timeAgo } from "@/lib/admin-format"
import { INPUT_CLASS, SELECT_CLASS } from "@/lib/admin-styles"
import { parseApiError } from "@/lib/errors"
import { formatPrice } from "@/lib/format"
import { useDebouncedValue } from "@/lib/use-debounce"
import { usePolling } from "@/lib/use-polling"
import { getAdminCustomers, setCustomerActive } from "@/services/admin-api"
import type { AdminCustomer } from "@/types"

const PAGE_SIZE = 12 // igual que el backend (AdminPagination)
const POLL_MS = 5000

const ORDERINGS = [
  { value: "-date_joined", label: "Más recientes" },
  { value: "date_joined", label: "Más antiguos" },
  { value: "username", label: "Usuario (A-Z)" },
  { value: "-orders_paid", label: "Más pedidos" },
  { value: "-total_spent", label: "Mayor gasto" },
]

export default function AdminCustomers() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [ordering, setOrdering] = useState("-date_joined")
  const [page, setPage] = useState(1)

  const [confirming, setConfirming] = useState<AdminCustomer | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const query = { page, search: debouncedSearch, is_active: status, ordering }
  const { data, error, loading, lastUpdated, refresh } = usePolling(
    () => getAdminCustomers(query),
    POLL_MS,
    JSON.stringify(query)
  )

  const rows = data?.results ?? []
  const now = lastUpdated ? lastUpdated.getTime() : 0

  // El aviso de "hecho" se oculta solo
  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(null), 4000)
    return () => window.clearTimeout(id)
  }, [notice])

  const runToggle = async (customer: AdminCustomer, active: boolean) => {
    setActionBusy(true)
    setActionError(null)
    try {
      await setCustomerActive(customer.id, active)
      setNotice(
        active
          ? `La cuenta de ${customer.full_name} se reactivó.`
          : `La cuenta de ${customer.full_name} se desactivó.`
      )
      setConfirming(null)
      refresh()
    } catch (err) {
      setActionError(parseApiError(err, "No se pudo actualizar la cuenta.").message)
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            <span className="text-metal">Clientes</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {data ? `${data.count} clientes` : "Cargando..."} · los nuevos aparecen solos.
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

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          <Check className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      {/* Filtros */}
      <GlassCard className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr]">
        <div className="relative sm:col-span-2 xl:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            aria-label="Buscar clientes"
            placeholder="Buscar por nombre, usuario, correo o teléfono..."
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
          <option value="">Activos e inactivos</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
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

      {actionError && !confirming && (
        <div
          role="alert"
          className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300"
        >
          {actionError}
        </div>
      )}

      {/* Tabla */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Registro</th>
                <th className="px-4 py-3 font-medium">Pedidos</th>
                <th className="px-4 py-3 font-medium">Gastado</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Cuenta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && !data && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-purple-500" />
                  </td>
                </tr>
              )}

              {data && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    No hay clientes con esos filtros.
                  </td>
                </tr>
              )}

              {rows.map((customer) => {
                const fresh = isFresh(customer.date_joined, now)
                return (
                  <tr
                    key={customer.id}
                    className={`transition-colors hover:bg-white/[0.03] ${
                      fresh ? "bg-purple-500/[0.07]" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-semibold text-purple-200">
                          {initials(customer.full_name)}
                        </span>
                        <div className="min-w-0 max-w-[13rem]">
                          <p className="truncate font-medium">
                            {customer.full_name}
                            {fresh && (
                              <span className="ml-2">
                                <Badge tone="purple">Nuevo</Badge>
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-zinc-500">@{customer.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[15rem] truncate text-zinc-300">{customer.email}</p>
                      <p className="text-xs text-zinc-500">
                        {[customer.phone, customer.city].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-300">
                      {formatDate(customer.date_joined)}
                      <p className="text-xs text-zinc-500">{timeAgo(customer.date_joined, now)}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{customer.orders_count}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      {formatPrice(customer.total_spent)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={customer.is_active ? "success" : "neutral"}>
                        {customer.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {customer.is_active ? (
                        <button
                          type="button"
                          aria-label={`Desactivar la cuenta de ${customer.full_name}`}
                          title="Desactivar cuenta"
                          onClick={() => {
                            setActionError(null)
                            setConfirming(customer)
                          }}
                          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-red-300"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Reactivar la cuenta de ${customer.full_name}`}
                          title="Reactivar cuenta"
                          disabled={actionBusy}
                          onClick={() => void runToggle(customer, true)}
                          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-emerald-300 disabled:opacity-40"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <Pagination page={page} count={data?.count ?? 0} pageSize={PAGE_SIZE} onChange={setPage} />
      </GlassCard>

      {confirming && (
        <ConfirmModal
          danger
          title="Desactivar cuenta"
          message={`${confirming.full_name} (@${confirming.username}) ya no podrá iniciar sesión y su sesión abierta dejará de funcionar. Sus pedidos se conservan y podrás reactivar la cuenta cuando quieras.`}
          confirmLabel="Desactivar"
          busy={actionBusy}
          error={actionError}
          onConfirm={() => void runToggle(confirming, false)}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  )
}