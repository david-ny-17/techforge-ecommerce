import {
  Award,
  Boxes,
  Cpu,
  Monitor,
  ShoppingBag,
  TrendingDown,
  TriangleAlert,
  Users,
  Wallet,
} from "lucide-react"
import { useState } from "react"

import GlassCard from "@/components/admin/GlassCard"
import KpiCard from "@/components/admin/KpiCard"
import LiveActivity from "@/components/admin/LiveActivity"
import SalesChart from "@/components/admin/SalesChart"
import { useAuth } from "@/context/useAuth"
import { formatPrice } from "@/lib/format"
import { usePolling } from "@/lib/use-polling"
import { getAdminDashboard } from "@/services/admin-api"

// Cada cuánto se refresca el dashboard
const POLL_MS = 5000
const PERIODS = [7, 30, 90]

const count = (value: number) => value.toLocaleString("es-PE")

export default function AdminDashboard() {
  const { user } = useAuth()
  const [days, setDays] = useState(30)
  const { data, error, lastUpdated } = usePolling(() => getAdminDashboard(days), POLL_MS, days)

  const kpis = data?.kpis
  const best = data?.top_products[0]
  const least = data?.least_sold
  const topProducts = data?.top_products ?? []
  const series = data?.sales_series ?? []
  const periodTotal = series.reduce((sum, point) => sum + point.total, 0)
  const periodOrders = series.reduce((sum, point) => sum + point.orders, 0)
  const maxUnits = Math.max(1, ...topProducts.map((product) => product.units))

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Bienvenido, <span className="text-metal">{user?.first_name || user?.username}</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Así va TechForge, en tiempo real.</p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-400 backdrop-blur">
          <span
            className={`h-2 w-2 rounded-full ${error ? "bg-red-500" : "animate-pulse bg-emerald-400"}`}
          />
          {error
            ? "Sin conexión con el servidor · reintentando"
            : lastUpdated
              ? `En vivo · actualizado ${lastUpdated.toLocaleTimeString("es-PE")}`
              : "Conectando..."}
        </div>
      </header>

      {error && !data && (
        <div
          role="alert"
          className="rounded-2xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300"
        >
          No se pudo cargar el dashboard. Comprueba que el backend esté en marcha; se reintenta solo
          cada pocos segundos.
        </div>
      )}

      {/* Datos principales */}
      <section aria-label="Resumen" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Ventas totales"
          icon={Wallet}
          value={kpis ? formatPrice(kpis.total_sales) : "—"}
          hint={kpis ? `Hoy: ${formatPrice(kpis.sales_today)}` : undefined}
        />
        <KpiCard
          label="Pedidos pagados"
          icon={ShoppingBag}
          value={kpis ? count(kpis.paid_orders) : "—"}
          hint={kpis ? `${count(kpis.pending_orders)} pendientes de pago` : undefined}
        />
        <KpiCard
          label="Clientes"
          icon={Users}
          value={kpis ? count(kpis.customers) : "—"}
          hint={kpis ? `+${count(kpis.new_customers_today)} hoy` : undefined}
        />
        <KpiCard
          label="Productos activos"
          icon={Boxes}
          value={kpis ? count(kpis.products_active) : "—"}
          hint={kpis ? `${count(kpis.out_of_stock)} agotados` : undefined}
        />
        <KpiCard
          label="PCs completas vendidas"
          icon={Cpu}
          value={kpis ? count(kpis.pcs_sold) : "—"}
          hint={kpis ? `Más ${count(kpis.laptops_sold)} laptops vendidas` : undefined}
        />
        <KpiCard
          label="Setups completos vendidos"
          icon={Monitor}
          value={kpis ? count(kpis.setups_sold) : "—"}
          hint="PC completa + monitor, teclado y mouse"
        />
        <KpiCard
          label="Producto más vendido"
          icon={Award}
          compact
          value={best ? best.name : "Sin ventas aún"}
          hint={best ? `${count(best.units)} unidades · ${formatPrice(best.revenue)}` : undefined}
        />
        <KpiCard
          label="Producto menos vendido"
          icon={TrendingDown}
          compact
          value={least ? least.name : "Sin ventas aún"}
          hint={
            least
              ? least.product_id === best?.product_id
                ? "Es el único producto vendido por ahora"
                : `${count(least.units)} unidades · ${formatPrice(least.revenue)}`
              : undefined
          }
        />
      </section>

      {/* Ventas y actividad */}
      <section className="grid gap-5 xl:grid-cols-3">
        <GlassCard className="p-5 xl:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold">Ventas</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Últimos {days} días · {formatPrice(periodTotal)} · {count(periodOrders)} pedidos
                pagados
              </p>
            </div>
            <div className="flex gap-1 rounded-xl border border-white/5 bg-black/30 p-1">
              {PERIODS.map((period) => (
                <button
                  key={period}
                  type="button"
                  aria-pressed={days === period}
                  onClick={() => setDays(period)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    days === period
                      ? "bg-purple-500/20 text-purple-100"
                      : "text-zinc-400 hover:text-gray-100"
                  }`}
                >
                  {period} días
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            {data && periodOrders === 0 ? (
              <p className="flex h-64 items-center justify-center text-sm text-zinc-500">
                Aún no hay ventas pagadas en este periodo.
              </p>
            ) : (
              <SalesChart data={series} />
            )}
          </div>
        </GlassCard>

        <LiveActivity
          users={data?.recent_users ?? []}
          orders={data?.recent_orders ?? []}
          serverTime={data?.generated_at ?? null}
        />
      </section>

      {/* Ranking y stock */}
      <section className="grid gap-5 xl:grid-cols-3">
        <GlassCard className="p-5 xl:col-span-2">
          <h2 className="font-semibold">Productos más vendidos</h2>
          {topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Aún no hay ventas pagadas.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {topProducts.map((product, index) => (
                <li key={product.product_id} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate text-sm">
                      <span className="mr-2 text-zinc-600">{index + 1}</span>
                      {product.name}
                      <span className="ml-2 text-xs text-zinc-500">{product.category}</span>
                    </p>
                    <p className="shrink-0 text-xs text-zinc-400">
                      {count(product.units)} u. · {formatPrice(product.revenue)}
                    </p>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(product.units / maxUnits) * 100}%`,
                        backgroundImage: "linear-gradient(90deg, #5b19a0, #a966ff)",
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <TriangleAlert className="h-4 w-4 text-amber-400" />
            Stock bajo
          </h2>
          {data && data.low_stock.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              Todos los productos tienen stock suficiente.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {(data?.low_stock ?? []).map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{item.name}</p>
                    <p className="truncate text-xs text-zinc-500">{item.category}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                      item.stock === 0
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {item.stock === 0 ? "Agotado" : `${item.stock} u.`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </section>
    </div>
  )
}