import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect } from "react"

import { useCountdown } from "@/lib/use-countdown"

type CountdownSize = "sm" | "lg"

interface CountdownProps {
  endsAt: string // fecha ISO en que termina la oferta
  serverOffsetMs?: number // desfase del reloj del servidor (getServerOffset)
  size?: CountdownSize // "sm" para la barra, "lg" para la página /offers
  onExpire?: () => void // se llama una vez al llegar a cero (conviene pasar una función estable)
  className?: string
}

// Estilos de cada tamaño: celda de cristal, número y etiqueta
const SIZE_STYLES: Record<
  CountdownSize,
  { gap: string; cell: string; number: string; color: string; label: string }
> = {
  sm: {
    gap: "gap-1.5",
    cell: "min-w-[2.6rem] rounded-lg px-1.5 pb-1 pt-1.5",
    number: "h-5 text-base",
    color: "text-gray-100",
    label: "mt-0.5 text-[9px]",
  },
  lg: {
    gap: "gap-2 sm:gap-4",
    cell: "min-w-[4.25rem] rounded-xl px-2 pb-2 pt-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_0_28px_rgb(139_47_232/0.18)] sm:min-w-[6.5rem] sm:rounded-2xl sm:pb-3 sm:pt-4",
    number: "h-10 text-4xl sm:h-16 sm:text-6xl",
    color: "text-metal",
    label: "mt-1.5 text-[10px] sm:text-xs",
  },
}

const pad = (n: number) => String(n).padStart(2, "0")

interface AnimatedNumberProps {
  value: string
  className: string
  animate: boolean
}

// El número viejo sube y se desvanece; el nuevo entra desde abajo
function AnimatedNumber({ value, className, animate }: AnimatedNumberProps) {
  if (!animate) return <span className={className}>{value}</span>

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={value}
        className={className}
        initial={{ y: "70%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "-70%", opacity: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  )
}

interface CellProps {
  value: number
  label: string
  size: CountdownSize
  animate: boolean
}

function Cell({ value, label, size, animate }: CellProps) {
  const style = SIZE_STYLES[size]

  return (
    <div
      aria-hidden="true"
      className={`flex flex-col items-center border border-purple-700/40 bg-black/50 text-center backdrop-blur ${style.cell}`}
    >
      <div
        className={`relative flex w-full items-center justify-center overflow-hidden font-bold leading-none tabular-nums ${style.number}`}
      >
        <AnimatedNumber
          value={pad(value)}
          animate={animate}
          className={`block ${style.color}`}
        />
      </div>
      <span
        className={`font-medium uppercase tracking-widest text-purple-300/70 ${style.label}`}
      >
        {label}
      </span>
    </div>
  )
}

export default function Countdown({
  endsAt,
  serverOffsetMs = 0,
  size = "sm",
  onExpire,
  className = "",
}: CountdownProps) {
  const { days, hours, minutes, seconds, expired } = useCountdown(endsAt, serverOffsetMs)
  const reduceMotion = useReducedMotion()

  // Avisa una sola vez cuando llega a cero, para que quien lo usa refresque las ofertas
  useEffect(() => {
    if (expired) onExpire?.()
  }, [expired, onExpire])

  if (expired) return null

  const animate = !reduceMotion
  const label =
    `Termina en ${days > 0 ? `${days} días, ` : ""}` +
    `${hours} horas, ${minutes} minutos y ${seconds} segundos`

  return (
    <div
      role="timer"
      aria-label={label}
      className={`flex items-stretch ${SIZE_STYLES[size].gap} ${className}`}
    >
      {days > 0 && <Cell value={days} label="días" size={size} animate={animate} />}
      <Cell value={hours} label="hrs" size={size} animate={animate} />
      <Cell value={minutes} label="min" size={size} animate={animate} />
      <Cell value={seconds} label="seg" size={size} animate={animate} />
    </div>
  )
}