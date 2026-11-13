import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useCallback, useEffect, useState } from "react"

import CategoryShowcase from "@/components/home/CategoryShowcase"
import HeroIntro from "@/components/home/HeroIntro"
import ShowcaseFallback from "@/components/home/ShowcaseFallback"
import { hasWebGL } from "@/components/home/home-utils"

const MOUNT_SCENE_MS = 1200 
const WARM_UP_MS = 3500 
const INTRO_MS = 5500 

const session = { introPlayed: false }

type Phase = "intro" | "showcase"

function CinematicStage() {
  const [phase, setPhase] = useState<Phase>(() => (session.introPlayed ? "showcase" : "intro"))
  const [mountScene, setMountScene] = useState(() => session.introPlayed)
  const [warm, setWarm] = useState(false)

  const finishIntro = useCallback(() => {
    session.introPlayed = true
    setMountScene(true)
    setPhase("showcase")
  }, [])

  useEffect(() => {
    if (phase !== "intro") return
    const timers = [
      window.setTimeout(() => setMountScene(true), MOUNT_SCENE_MS),
      window.setTimeout(() => setWarm(true), WARM_UP_MS),
      window.setTimeout(finishIntro, INTRO_MS),
    ]
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [phase, finishIntro])

  const revealed = phase === "showcase"

  return (
    <section
      aria-label="Inicio de TechForge"
      className="relative h-[calc(100svh-4rem)] min-h-[620px] overflow-hidden bg-black"
    >
      {/* Cuando la intro termina, el título pasa a ser un encabezado oculto para lectores de pantalla */}
      {revealed && (
        <h1 className="sr-only">TechForge: el lugar donde armarás el setup de tus sueños</h1>
      )}

      {/* Carrusel 3D: espera debajo de la intro y aparece cuando esta termina */}
      <motion.div
        className="absolute inset-0 z-10"
        initial={false}
        animate={{ opacity: revealed ? 1 : 0, scale: revealed ? 1 : 1.06 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        inert={!revealed}
      >
        {mountScene && <CategoryShowcase active={revealed || warm} revealed={revealed} />}
      </motion.div>

      {/* Intro: al salir sube, se desenfoca y se desvanece */}
      <AnimatePresence>
        {phase === "intro" && (
          <motion.div
            key="intro"
            className="absolute inset-0 z-20"
            exit={{ opacity: 0, y: -48, scale: 1.04, filter: "blur(12px)" }}
            transition={{ duration: 0.9, ease: "easeIn" }}
          >
            <HeroIntro onSkip={finishIntro} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function StaticStage() {
  return (
    <>
      <div className="h-[60svh] min-h-[460px]">
        <HeroIntro />
      </div>
      <ShowcaseFallback />
    </>
  )
}

export default function HomeStage() {
  const reduceMotion = useReducedMotion()
  const [webgl] = useState(hasWebGL)

  return webgl && !reduceMotion ? <CinematicStage /> : <StaticStage />
}