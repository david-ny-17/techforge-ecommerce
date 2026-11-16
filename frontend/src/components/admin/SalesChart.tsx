import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { formatPrice } from "@/lib/format"
import type { AdminSalesPoint } from "@/types"

// "2026-11-16" -> "16 nov"
function shortDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
  })
}

// 12500 -> "12.5k"
function compact(value: number): string {
  if (value < 1000) return String(value)
  return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
}

const AXIS_TICK = { fill: "#71717a", fontSize: 11 }

export default function SalesChart({ data }: { data: AdminSalesPoint[] }) {
  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a966ff" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#8b2fe8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={compact}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(10, 6, 20, 0.92)",
              border: "1px solid rgba(139, 47, 232, 0.45)",
              borderRadius: 12,
              color: "#f3f4f6",
            }}
            labelStyle={{ color: "#a1a1aa" }}
            cursor={{ stroke: "#a966ff", strokeOpacity: 0.35 }}
            formatter={(value) => [formatPrice(Number(value)), "Ventas"]}
            labelFormatter={(label) => shortDate(String(label))}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#a966ff"
            strokeWidth={2}
            fill="url(#salesFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}