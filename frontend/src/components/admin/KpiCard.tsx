import type { LucideIcon } from "lucide-react"

import GlassCard from "@/components/admin/GlassCard"

interface KpiCardProps {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  // true para valores de texto largo (nombres de producto)
  compact?: boolean
}

export default function KpiCard({ label, value, hint, icon: Icon, compact = false }: KpiCardProps) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-zinc-400">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p
        title={value}
        className={`mt-3 truncate font-bold tracking-tight ${
          compact ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 truncate text-xs text-zinc-500">{hint}</p>}
    </GlassCard>
  )
}