import type { ReactNode } from "react"

type Tone = "success" | "warning" | "danger" | "neutral" | "purple"

const TONES: Record<Tone, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  danger: "border-red-500/30 bg-red-500/10 text-red-300",
  neutral: "border-white/10 bg-white/5 text-zinc-300",
  purple: "border-purple-400/40 bg-purple-500/20 text-purple-200",
}

export default function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone
  children: ReactNode
}) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  )
}