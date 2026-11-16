import { ArrowRight, Bot, Sparkles } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import AnimatedText from "@/components/home/AnimatedText"

// Aparece con un fundido suave cuando el bloque entra en pantalla (una sola vez)
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, delay: reduceMotion ? 0 : delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

// Cierre de la página de inicio: va DEBAJO del catálogo 3D, que sigue siendo lo primero que se ve
export default function HomeClosing() {
  return (
    <section
      aria-labelledby="assistant-title"
      className="relative overflow-hidden border-t border-zinc-900 bg-black px-4 py-24 sm:px-6 lg:px-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(139_47_232/0.16),transparent_65%)]"
      />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
        <Reveal>
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-purple-600 bg-purple-900/20 shadow-[0_0_32px_rgb(139_47_232/0.45)]">
            <Bot className="h-8 w-8 text-purple-400" />
          </div>
        </Reveal>

        <Reveal delay={0.15} className="mt-5">
          <p className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-purple-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-purple-500" />
            TechForge AI · asistente
          </p>
        </Reveal>

        <h2 id="assistant-title" className="mt-4 text-3xl font-bold sm:text-4xl">
          <AnimatedText
            text="¿Necesitas ayuda para armar tu setup?"
            className="block"
            delay={0.3}
            stagger={0.03}
            inView
          />
        </h2>

        <Reveal delay={1.5} className="mt-4">
          <p className="max-w-xl text-zinc-400 sm:text-lg">
            Cuéntale a nuestro asistente qué harás con tu PC y cuánto quieres gastar. Te propone
            una configuración compatible en segundos, te sugiere componentes o periféricos y la
            ajusta contigo hasta que quede a tu medida.
          </p>
        </Reveal>

        <Reveal delay={1.8} className="mt-8 flex flex-col items-center gap-4">
          <Link
            to="/builder"
            className="bg-metal glow-purple inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white"
          >
            <Sparkles className="h-4 w-4" />
            Hablar con el asistente
          </Link>
          <Link
            to="/catalog"
            className="group inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-purple-300"
          >
            o ver todo el catálogo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}