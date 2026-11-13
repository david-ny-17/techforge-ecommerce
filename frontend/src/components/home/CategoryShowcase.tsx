import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react"
import { lazy, Suspense, useEffect, useRef, useState } from "react"
import type { KeyboardEvent, PointerEvent, WheelEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { SHOWCASE_ITEMS } from "@/components/home/showcase-data"

const ShowcaseScene = lazy(() => import("@/components/home/ShowcaseScene"))

const COUNT = SHOWCASE_ITEMS.length
const AUTOPLAY_MS = 4500
const DRAG_START_PX = 8 
const DRAG_STEP_PX = 80 

const categoryUrl = (slug: string) => `/catalog?category=${slug}`

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas")
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"))
  } catch {
    return false
  }
}

function ShowcaseFallback() {
  return (
    <section
      id="showcase"
      aria-label="Explora por categorías"
      className="mx-auto max-w-7xl scroll-mt-16 px-4 py-16 sm:px-6 lg:px-8"
    >
      <h2 className="mb-8 text-center text-3xl font-bold">
        Explora por <span className="text-metal">categorías</span>
      </h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {SHOWCASE_ITEMS.map((item) => (
          <li key={item.slug}>
            <Link
              to={categoryUrl(item.slug)}
              className="block h-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition-colors hover:border-purple-600 hover:bg-purple-900/10"
            >
              <p className="font-semibold text-gray-100">{item.name}</p>
              <p className="mt-1 text-xs text-zinc-500">{item.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function CategoryShowcase() {
  const reduceMotion = useReducedMotion()
  const [webgl] = useState(hasWebGL)
  const navigate = useNavigate()

  const sectionRef = useRef<HTMLElement>(null)
  const nearView = useInView(sectionRef, { margin: "400px", once: true })
  const inView = useInView(sectionRef)

  const [target, setTarget] = useState(0)
  const [hovered, setHovered] = useState(false)
  const drag = useRef({ pressed: false, dragging: false, startX: 0, lastX: 0, acc: 0 })
  const lastWheel = useRef(0)

  const activeIndex = ((target % COUNT) + COUNT) % COUNT
  const active = SHOWCASE_ITEMS[activeIndex]

  const step = (amount: number) => setTarget((t) => t + amount)

  const moveTo = (index: number) => {
    let diff = (((index - activeIndex) % COUNT) + COUNT) % COUNT
    if (diff > COUNT / 2) diff -= COUNT
    if (diff !== 0) step(diff)
  }

  const handleItemClick = (index: number) => {
    if (index === activeIndex) navigate(categoryUrl(SHOWCASE_ITEMS[index].slug))
    else moveTo(index)
  }

  const canAutoplay = webgl && !reduceMotion && inView && !hovered
  useEffect(() => {
    if (!canAutoplay) return
    const id = window.setTimeout(() => setTarget((t) => t + 1), AUTOPLAY_MS)
    return () => window.clearTimeout(id)
  }, [canAutoplay, target])

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { pressed: true, dragging: false, startX: e.clientX, lastX: e.clientX, acc: 0 }
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (!state.pressed) return

    if (!state.dragging) {
      if (Math.abs(e.clientX - state.startX) < DRAG_START_PX) return
      state.dragging = true
      state.lastX = e.clientX
      e.currentTarget.setPointerCapture(e.pointerId)
      return
    }

    state.acc += e.clientX - state.lastX
    state.lastX = e.clientX
    if (state.acc >= DRAG_STEP_PX) {
      step(-1)
      state.acc = 0
    } else if (state.acc <= -DRAG_STEP_PX) {
      step(1)
      state.acc = 0
    }
  }

  const endDrag = () => {
    drag.current.pressed = false
    drag.current.dragging = false
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault()
      step(1)
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      step(-1)
    }
  }

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 20) return
    const now = Date.now()
    if (now - lastWheel.current < 450) return
    lastWheel.current = now
    step(e.deltaX > 0 ? 1 : -1)
  }

  if (!webgl || reduceMotion) return <ShowcaseFallback />

  return (
    <section
      id="showcase"
      ref={sectionRef}
      aria-label="Explora por categorías"
      className="relative scroll-mt-16 overflow-hidden bg-black"
    >
      <div
        role="group"
        aria-roledescription="carrusel"
        aria-label="Categorías de TechForge"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        className="relative h-[calc(100svh-4rem)] min-h-[620px] touch-pan-y select-none focus-visible:outline-none"
      >
        {/* Título gigante detrás de los objetos */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center pb-28"
        >
          <span className="text-metal select-none whitespace-nowrap text-[15vw] font-black leading-none tracking-tighter opacity-[0.14]">
            TECHFORGE
          </span>
        </div>

        <p className="pointer-events-none absolute inset-x-0 top-8 text-center text-xs font-medium uppercase tracking-[0.4em] text-purple-400">
          Explora por categorías
        </p>

        {/* Escena 3D */}
        <div className="absolute inset-0">
          {nearView && (
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              }
            >
              <ShowcaseScene target={target} active={inView} onItemClick={handleItemClick} />
            </Suspense>
          )}
        </div>

        {/* Flechas */}
        <button
          type="button"
          aria-label="Categoría anterior"
          onClick={() => step(-1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-purple-700/60 bg-black/50 p-2 text-purple-300 backdrop-blur transition-colors hover:border-purple-500 hover:bg-purple-900/30 sm:left-6 sm:p-3"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <button
          type="button"
          aria-label="Categoría siguiente"
          onClick={() => step(1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-purple-700/60 bg-black/50 p-2 text-purple-300 backdrop-blur transition-colors hover:border-purple-500 hover:bg-purple-900/30 sm:right-6 sm:p-3"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Información de la categoría activa */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-4 pb-8 text-center">
          <div aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.slug}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-2"
              >
                <h2 className="text-3xl font-bold sm:text-4xl">
                  <span className="text-metal">{active.name}</span>
                </h2>
                <p className="max-w-md text-sm text-zinc-400 sm:text-base">{active.description}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <Link
            to={categoryUrl(active.slug)}
            className="bg-metal glow-purple pointer-events-auto inline-flex items-center gap-2 rounded-lg px-6 py-2.5 font-semibold text-white"
          >
            Ver {active.name}
            <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="pointer-events-auto mt-1 flex gap-1.5">
            {SHOWCASE_ITEMS.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                aria-label={`Ir a ${item.name}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => moveTo(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex
                    ? "w-6 bg-purple-500"
                    : "w-1.5 bg-zinc-700 hover:bg-purple-700"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}