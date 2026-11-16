import { Activity } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

import GlassCard from "@/components/admin/GlassCard"
import { formatPrice } from "@/lib/format"
import type { AdminRecentOrder, AdminRecentUser, OrderStatus } from "@/types"

type Tab = "customers" | "orders"

// Un elemento se marca como "Nuevo" durante 90 s desde que se creó
const FRESH_MS = 90_000

const STATUS_STYLES: Record<OrderStatus, { label: string; className: string }> = {
  PAID: { label: "Pagado", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  PENDING: { label: "Pendiente", className: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  FAILED: { label: "Fallido", className: "border-red-500/30 bg-red-500/10 text-red-300" },
}

function timeAgo(iso: string, now: number): string {
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000))
  if (seconds < 45) return "ahora"
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  return `hace ${Math.round(hours / 24)} d`
}

const isFresh = (iso: string, now: number) => now - Date.parse(iso) < FRESH_MS

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function NewBadge() {
  return (
    <span className="mb-0.5 inline-block rounded-full border border-purple-400/40 bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-200">
      Nuevo
    </span>
  )
}

const itemMotion = {
  layout: true,
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.35 },
} as const

const itemClass =
  "flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5"

interface LiveActivityProps {
  users: AdminRecentUser[]
  orders: AdminRecentOrder[]
  // Hora del servidor de la última respuesta (null mientras carga)
  serverTime: string | null
}

export default function LiveActivity({ users, orders, serverTime }: LiveActivityProps) {
  const [tab, setTab] = useState<Tab>("customers")
  const now = serverTime ? Date.parse(serverTime) : 0

  const tabClass = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? "bg-purple-500/20 text-purple-100" : "text-zinc-400 hover:text-gray-100"
    }`

  return (
    <GlassCard className="flex h-full flex-col p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <Activity className="h-4 w-4 text-purple-400" />
          Actividad en vivo
        </h2>
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          en tiempo real
        </span>
      </div>

      <div className="mt-4 flex gap-1 rounded-xl border border-white/5 bg-black/30 p-1">
        <button type="button" aria-pressed={tab === "customers"} onClick={() => setTab("customers")} className={tabClass(tab === "customers")}>
          Clientes
        </button>
        <button type="button" aria-pressed={tab === "orders"} onClick={() => setTab("orders")} className={tabClass(tab === "orders")}>
          Pedidos
        </button>
      </div>

      {tab === "customers" ? (
        <ul key="customers" className="mt-4 space-y-2">
          {users.length === 0 && (
            <li className="py-6 text-center text-sm text-zinc-500">Aún no hay clientes registrados.</li>
          )}
          <AnimatePresence initial={false}>
            {users.map((user) => (
              <motion.li key={user.id} {...itemMotion} className={itemClass}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-semibold text-purple-200">
                  {initials(user.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-zinc-500">{user.email}</p>
                </div>
                <div className="shrink-0 text-right">
                  {isFresh(user.date_joined, now) && <NewBadge />}
                  <p className="text-xs text-zinc-500">{timeAgo(user.date_joined, now)}</p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <ul key="orders" className="mt-4 space-y-2">
          {orders.length === 0 && (
            <li className="py-6 text-center text-sm text-zinc-500">Aún no hay pedidos.</li>
          )}
          <AnimatePresence initial={false}>
            {orders.map((order) => {
              const status = STATUS_STYLES[order.status]
              return (
                <motion.li key={order.id} {...itemMotion} className={itemClass}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      Pedido #{order.id}
                      <span className="ml-2 font-normal text-zinc-500">{order.customer}</span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatPrice(order.total)} · {timeAgo(order.created_at, now)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {isFresh(order.created_at, now) && <NewBadge />}
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </GlassCard>
  )
}