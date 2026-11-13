import { ArrowRight } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { Link } from "react-router-dom"

import AnimatedText from "@/components/home/AnimatedText"

const GRID_LINE = "rgb(139 47 232 / 0.14)"
const GRID_MASK = "radial-gradient(ellipse at center, black 25%, transparent 72%)"

export default function HeroIntro() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden bg-black px-4 py-16">
      {/* Fondo: cuadrícula tenue + resplandores morados que se mueven despacio */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `linear-gradient(to right, ${GRID_LINE} 1px, transparent 1px), linear-gradient(to bottom, ${GRID_LINE} 1px, transparent 1px)`,
            backgroundSize: "56px 56px",
            maskImage: GRID_MASK,
            WebkitMaskImage: GRID_MASK,
          }}
        />
        <motion.div
          className="absolute left-[8%] top-[18%] h-72 w-72 rounded-full bg-purple-600/30 blur-3xl sm:h-96 sm:w-96"
          animate={reduceMotion ? undefined : { x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[12%] right-[6%] h-80 w-80 rounded-full bg-purple-800/40 blur-3xl sm:h-[28rem] sm:w-[28rem]"
          animate={reduceMotion ? undefined : { x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h1>
          <AnimatedText
            text="Bienvenido a"
            className="block text-xl font-medium uppercase tracking-[0.35em] text-zinc-400 sm:text-2xl"
            delay={0.3}
            stagger={0.05}
          />
          <span
            className="mt-2 block"
            style={{ filter: "drop-shadow(0 0 28px rgb(139 47 232 / 0.5))" }}
          >
            <AnimatedText
              text="TechForge"
              className="block text-6xl font-extrabold tracking-tight sm:text-8xl lg:text-9xl"
              letterClassName="text-metal"
              delay={1}
              stagger={0.07}
            />
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 sm:text-xl">
          <AnimatedText
            text="el lugar donde armarás el setup de tus sueños"
            delay={2}
            stagger={0.025}
          />
        </p>

        <motion.div
          className="mt-10"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.2, duration: 0.6, ease: "easeOut" }}
        >
          <Link
            to="/catalog"
            className="bg-metal glow-purple inline-flex items-center gap-2 rounded-lg px-8 py-3 text-lg font-bold text-white"
          >
            Explorar catálogo
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}