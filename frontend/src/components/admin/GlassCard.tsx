import type { ReactNode } from "react"

interface GlassCardProps {
  children: ReactNode
  className?: string
}

// Panel de cristal: translúcido, con desenfoque del fondo y un brillo fino en el borde superior
export default function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgb(255_255_255/0.07),0_8px_32px_rgb(0_0_0/0.45)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  )
}