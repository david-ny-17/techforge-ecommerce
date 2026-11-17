import { X } from "lucide-react"
import { useEffect, useId } from "react"
import type { ReactNode } from "react"

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  // Botones de acción: quedan fijos abajo, siempre visibles aunque el contenido tenga scroll
  footer?: ReactNode
  // true mientras se guarda: impide cerrar para no perder el envío
  busy?: boolean
  wide?: boolean
}

export default function Modal({
  title,
  onClose,
  children,
  footer,
  busy = false,
  wide = false,
}: ModalProps) {
  const titleId = useId()

  // Esc cierra la ventana y el fondo no se desplaza mientras está abierta
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose()
    }
    document.addEventListener("keydown", handleKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = previousOverflow
    }
  }, [busy, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      {/* La ventana nunca es más alta que la pantalla (max-h-full): lo que sobra se
          desplaza dentro del contenido, con el encabezado y los botones siempre a la vista. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex max-h-full w-full ${
          wide ? "max-w-3xl" : "max-w-md"
        } flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90 shadow-[0_8px_48px_rgb(0_0_0/0.6)] backdrop-blur-xl`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-gray-100 disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 [scrollbar-color:rgb(139_47_232/0.5)_transparent] [scrollbar-width:thin]">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-white/10 bg-black/30 px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  )
}