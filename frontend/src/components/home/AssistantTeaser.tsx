import { ArrowRight, Sparkles, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

// Sale cuando la pista "Arrastra o usa las flechas" ya se fue (6,5 s en CategoryShowcase),
// para que haya un solo aviso a la vez y el 3D tenga todo el protagonismo al inicio.
const TEASER_DELAY_MS = 8000

// Si el usuario lo cierra, no vuelve a salir mientras siga en esta pestaña
const teaser = { dismissed: false }

interface AssistantTeaserProps {
  revealed: boolean
}

export default function AssistantTeaser({ revealed }: AssistantTeaserProps) {
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(() => teaser.dismissed)

  useEffect(() => {
    if (!revealed) return
    const id = window.setTimeout(() => setReady(true), TEASER_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [revealed])

  const handleDismiss = () => {
    teaser.dismissed = true
    setDismissed(true)
  }

  return (
    <AnimatePresence>
      {ready && !dismissed && (
        <motion.div
          key="assistant-teaser"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          // Solo en pantallas anchas (xl): ahí no se cruza con la información de la categoría
          className="absolute bottom-8 right-8 z-30 hidden items-center rounded-full border border-purple-700/50 bg-black/60 backdrop-blur xl:flex"
        >
          <Link
            to="/builder"
            className="group flex items-center gap-2 py-2 pl-4 pr-2 text-sm text-zinc-300 transition-colors hover:text-purple-200"
          >
            <Sparkles className="h-4 w-4 text-purple-400" />
            ¿Necesitas ayuda para armar tu setup?
            <ArrowRight className="h-4 w-4 text-purple-400 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Cerrar aviso del asistente"
            className="mr-1.5 rounded-full p-1.5 text-zinc-500 transition-colors hover:text-zinc-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}