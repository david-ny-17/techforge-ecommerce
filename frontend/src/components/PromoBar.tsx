import { ArrowRight, X } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import Countdown from "@/components/Countdown"
import { getServerOffset, useCountdown } from "@/lib/use-countdown"
import { getPromotions } from "@/services/api"
import type { Promotion } from "@/types"

const DISMISS_KEY = "techforge_promo_bar_dismissed"
const ROTATE_MS = 7000

interface PromoData {
  promotions: Promotion[]
  offsetMs: number
}

// Lee qué ofertas cerró el cliente en esta sesión (ids separados por coma)
function readDismissed(): string | null {
  try {
    return sessionStorage.getItem(DISMISS_KEY)
  } catch {
    return null
  }
}

interface PromoCardProps {
  promo: Promotion
  offsetMs: number
  onExpire: () => void
}

function PromoCard({ promo, offsetMs, onExpire }: PromoCardProps) {
  const { totalMs } = useCountdown(promo.ends_at, offsetMs)
  const span = Date.parse(promo.ends_at) - Date.parse(promo.starts_at)
  const remaining = span > 0 ? Math.min(1, Math.max(0, totalMs / span)) : 0
  const detail = promo.description || promo.categories.map((c) => c.name).join(" · ")

  return (
    <>
      <div className="relative flex flex-col gap-4 px-4 pb-4 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <span className="text-metal shrink-0 text-4xl font-black leading-none sm:text-5xl">
            -{promo.discount_percent}%
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-gray-100 sm:text-xl">{promo.name}</p>
            {detail && <p className="mt-0.5 line-clamp-2 text-sm text-zinc-400">{detail}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:shrink-0 sm:gap-4">
          <Countdown
            endsAt={promo.ends_at}
            serverOffsetMs={offsetMs}
            size="sm"
            onExpire={onExpire}
          />
          <Link
            to="/offers"
            className="bg-metal glow-purple inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold text-white"
          >
            Ver ofertas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Línea inferior: cuánto falta de la oferta */}
      <div aria-hidden="true" className="relative h-0.5 w-full bg-zinc-900">
        <div
          className="h-full transition-[width] duration-1000 ease-linear"
          style={{
            width: `${remaining * 100}%`,
            backgroundImage: "linear-gradient(90deg, #6d28d9, #a966ff, #c9a8ff)",
          }}
        />
      </div>
    </>
  )
}

interface PromoBarProps {
  className?: string
}

export default function PromoBar({ className = "" }: PromoBarProps) {
  const [data, setData] = useState<PromoData | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [dismissedKey, setDismissedKey] = useState<string | null>(readDismissed)
  const reduceMotion = useReducedMotion()

  // Ofertas vigentes. Se vuelve a pedir cuando una termina (attempt sube).
  useEffect(() => {
    let cancelled = false

    getPromotions()
      .then((response) => {
        if (cancelled) return
        const offsetMs = getServerOffset(response.server_time)
        // Se descarta lo que ya terminó según la hora del servidor
        const live = response.promotions.filter(
          (p) => Date.parse(p.ends_at) > Date.now() + offsetMs
        )
        setData({ promotions: live, offsetMs })
      })
      .catch(() => {
        // Sin ofertas o sin conexión: la barra simplemente no se muestra
        if (!cancelled) setData({ promotions: [], offsetMs: 0 })
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const handleExpire = useCallback(() => setAttempt((n) => n + 1), [])

  const promotions = data?.promotions ?? []
  const count = promotions.length

  // Si hay varias ofertas, rotan solas (se detienen con el mouse encima)
  useEffect(() => {
    if (count < 2 || paused) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS)
    return () => window.clearInterval(id)
  }, [count, paused])

  if (!data || count === 0) return null

  const idsKey = promotions.map((p) => p.id).join(",")
  if (dismissedKey === idsKey) return null

  const activeIndex = index % count
  const promo = promotions[activeIndex]
  const animate = !reduceMotion

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, idsKey)
    } catch {
      // Si el almacenamiento falla, se cierra igual hasta recargar la página
    }
    setDismissedKey(idsKey)
  }

  return (
    <section
      aria-label="Ofertas vigentes"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`relative overflow-hidden rounded-2xl border border-purple-700/50 bg-black/60 shadow-[0_0_40px_rgb(139_47_232/0.18)] backdrop-blur-xl ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(120% 160% at 0% 0%, rgb(139 47 232 / 0.22), transparent 55%)",
      }}
    >
      <div
        aria-hidden="true"
        className="h-px w-full"
        style={{
          backgroundImage: "linear-gradient(90deg, transparent, #a966ff, transparent)",
        }}
      />

      {/* Destello de luz que cruza la tarjeta de vez en cuando */}
      {animate && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3"
          style={{
            backgroundImage:
              "linear-gradient(100deg, transparent, rgb(169 102 255 / 0.14), transparent)",
          }}
          animate={{ x: ["0%", "420%"] }}
          transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, repeatDelay: 4 }}
        />
      )}

      <div className="relative flex items-center justify-between px-4 pt-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-400" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple-400">
            Oferta activa
          </span>

          {count > 1 && (
            <div className="ml-2 flex items-center">
              {promotions.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Ver la oferta ${p.name}`}
                  aria-current={i === activeIndex ? "true" : undefined}
                  className="group px-1 py-2"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all ${
                      i === activeIndex
                        ? "w-5 bg-purple-400"
                        : "w-1.5 bg-zinc-700 group-hover:bg-purple-500"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar el anuncio de ofertas"
          className="-mr-2 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-purple-400"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={promo.id}
          initial={animate ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          exit={animate ? { opacity: 0, y: -10 } : undefined}
          transition={{ duration: animate ? 0.3 : 0 }}
        >
          <PromoCard promo={promo} offsetMs={data.offsetMs} onExpire={handleExpire} />
        </motion.div>
      </AnimatePresence>
    </section>
  )
}