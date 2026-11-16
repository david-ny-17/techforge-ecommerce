import { Bookmark, Bot, Check, RotateCcw, Send, Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { FormEvent, KeyboardEvent } from "react"
import { Link } from "react-router-dom"

import AddAllBar from "@/components/AddAllBar"
import ProductCard from "@/components/ProductCard"
import { useAuth } from "@/context/useAuth"
import { defaultBuildName, sumPrices } from "@/lib/build-utils"
import { parseSavedBuildError, parseSmartBuilderError } from "@/lib/errors"
import { formatPrice } from "@/lib/format"
import { askSmartBuilder, createSavedBuild } from "@/services/api"
import type { BuilderTurn, SmartBuilderHistoryTurn } from "@/types"

// Deben coincidir con las validaciones del backend (SmartBuilderRequestSerializer)
const MIN_LENGTH = 10
const MAX_LENGTH = 600

// La conversación sobrevive a F5 y a cambiar de página, pero no al cerrar la pestaña
// (los precios y el stock guardados envejecen, así que no se conservan para siempre).
// Para conservar un armado a largo plazo está "Guardar armado".
const STORAGE_KEY = "techforge_builder_chat"
const MAX_TURNS_STORED = 6
// Turnos anteriores que se envían a la IA (el backend aplica el mismo tope)
const HISTORY_TURNS_SENT = 4

const EXAMPLES = [
  "Quiero una PC para jugar a 1440p por 4000 soles",
  "PC para programar y editar video con presupuesto de 3000 soles",
  "Equipo económico de oficina por 1500 soles",
]

const FOLLOW_UPS = [
  "Hazla un poco más barata",
  "Mejora la tarjeta gráfica",
  "Añade un monitor y un teclado",
]

const LOADING_STEPS = [
  "Analizando compatibilidad y cuellos de botella...",
  "Revisando el catálogo de TechForge...",
  "Cruzando sockets, memoria y consumo eléctrico...",
  "Optimizando tu presupuesto...",
  "Preparando tu configuración...",
]

function isBuilderTurn(value: unknown): value is BuilderTurn {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === "string" &&
    typeof v.prompt === "string" &&
    typeof v.message === "string" &&
    Array.isArray(v.products)
  )
}

// Lee la conversación guardada; si está corrupta o no existe, devuelve []
function loadTurns(): BuilderTurn[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isBuilderTurn) : []
  } catch {
    return []
  }
}

const toHistoryTurn = (turn: BuilderTurn): SmartBuilderHistoryTurn => ({
  prompt: turn.prompt,
  message: turn.message,
  product_ids: turn.products.map((p) => p.id),
  budget_pen: turn.budget_pen,
})

// ---------- "Guardar armado" (una barra por cada respuesta) ----------
function SaveBuildBar({
  turn,
  onSaved,
}: {
  turn: BuilderTurn
  onSaved: (turnId: string) => void
}) {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(() => defaultBuildName(turn.prompt))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    setError(null)
    try {
      await createSavedBuild({
        name: trimmed,
        prompt: turn.prompt,
        budget:
          typeof turn.budget_pen === "number" ? Math.round(turn.budget_pen * 100) / 100 : null,
        product_ids: turn.products.map((p) => p.id),
      })
      onSaved(turn.id)
    } catch (err) {
      setError(parseSavedBuildError(err))
    } finally {
      setSaving(false)
    }
  }

  const rowClass =
    "flex flex-col gap-3 border-t border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
  const linkClass =
    "rounded-lg border border-purple-600 bg-black px-4 py-2.5 text-sm font-semibold text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300"

  if (turn.saved) {
    return (
      <div className={rowClass}>
        <span className="flex items-center gap-2 text-sm text-purple-400">
          <Check className="h-4 w-4" />
          Armado guardado en tu cuenta.
        </span>
        <Link to="/builds" className={linkClass}>
          Ver mis armados
        </Link>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={rowClass}>
        <span className="text-sm text-zinc-500">
          Inicia sesión para guardar este armado y consultarlo cuando quieras.
        </span>
        <Link to="/login" className={linkClass}>
          Iniciar sesión
        </Link>
      </div>
    )
  }

  if (!editing) {
    return (
      <div className={rowClass}>
        <span className="text-sm text-zinc-500">
          Guarda este armado para consultarlo cuando quieras.
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-purple-600 bg-black px-4 py-2.5 text-sm font-semibold text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300"
        >
          <Bookmark className="h-4 w-4" />
          Guardar armado
        </button>
      </div>
    )
  }

  return (
    <div className="border-t border-zinc-800 px-5 py-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void handleSave()
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <label htmlFor={`build-name-${turn.id}`} className="sr-only">
          Nombre del armado
        </label>
        <input
          id={`build-name-${turn.id}`}
          type="text"
          value={name}
          maxLength={100}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del armado"
          className="w-full flex-1 rounded-lg border border-zinc-800 bg-black px-3 py-2.5 text-sm text-gray-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-600"
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={saving || name.trim().length === 0}
            className="bg-metal glow-purple inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale"
          >
            <Bookmark className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
            className="rounded-lg border border-zinc-800 bg-black px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:border-purple-700 hover:text-purple-400 disabled:opacity-40"
          >
            Cancelar
          </button>
        </div>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}

// ---------- Respuesta de la IA (un turno) ----------
function TurnAnswer({
  turn,
  onSaved,
}: {
  turn: BuilderTurn
  onSaved: (turnId: string) => void
}) {
  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-5 py-3">
          <Bot className="h-4 w-4 text-purple-500" />
          <span className="font-mono text-xs uppercase tracking-widest text-purple-500">
            TechForge AI
          </span>
        </div>

        <p className="whitespace-pre-line px-5 py-4 leading-relaxed text-zinc-200">
          {turn.message}
        </p>

        {turn.products.length > 0 && (
          <>
            <div className="flex items-end justify-between gap-4 border-t border-zinc-800 px-5 py-4">
              <span className="text-sm text-zinc-400">
                Total estimado <span className="text-zinc-600">(1 unidad de cada producto)</span>
              </span>
              <span className="text-metal text-2xl font-bold">
                {formatPrice(sumPrices(turn.products))}
              </span>
            </div>
            <AddAllBar products={turn.products} />
            <SaveBuildBar turn={turn} onSaved={onSaved} />
          </>
        )}
      </div>

      {turn.products.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-purple-500">
            Componentes recomendados ({turn.products.length})
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {turn.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm border border-purple-700/50 bg-purple-900/20 px-4 py-3 text-sm text-gray-100">
        {text}
      </p>
    </div>
  )
}

export default function SmartBuilder() {
  const [turns, setTurns] = useState<BuilderTurn[]>(loadTurns)
  const [prompt, setPrompt] = useState("")
  // Consulta en curso (o que falló): aún no es un turno completo
  const [pending, setPending] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [scrollTick, setScrollTick] = useState(0)
  const pendingRef = useRef<HTMLDivElement>(null)
  const lastTurnRef = useRef<HTMLDivElement>(null)

  // Guarda la conversación (solo turnos completos) para que sobreviva a F5
  useEffect(() => {
    try {
      if (turns.length === 0) {
        sessionStorage.removeItem(STORAGE_KEY)
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(turns.slice(-MAX_TURNS_STORED)))
      }
    } catch {
      // Si el almacenamiento falla, el chat sigue funcionando en memoria
    }
  }, [turns])

  // Rota los mensajes de carga y se queda en el último
  useEffect(() => {
    if (!loading) return
    const timer = window.setInterval(() => {
      setStep((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1))
    }, 2500)
    return () => window.clearInterval(timer)
  }, [loading])

  // Al enviar o al llegar la respuesta, lleva la vista a lo nuevo
  useEffect(() => {
    if (scrollTick === 0) return
    const target = pendingRef.current ?? lastTurnRef.current
    target?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [scrollTick])

  const runQuery = async (text: string) => {
    setLoading(true)
    setError(null)
    setStep(0)
    setPending(text)
    setScrollTick((tick) => tick + 1)
    try {
      const history = turns.slice(-HISTORY_TURNS_SENT).map(toHistoryTurn)
      const response = await askSmartBuilder(text, history)
      const newTurn: BuilderTurn = {
        id: Date.now().toString(),
        prompt: text,
        message: response.message,
        products: response.products,
        budget_pen: response.budget_pen ?? null,
      }
      setTurns((prev) => [...prev, newTurn])
      setPending(null)
      // Vacía el cuadro solo si el usuario no escribió otra cosa mientras esperaba
      setPrompt((current) => (current.trim() === text ? "" : current))
      setScrollTick((tick) => tick + 1)
    } catch (err) {
      setError(parseSmartBuilderError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const text = prompt.trim()
    if (loading || text.length < MIN_LENGTH) return
    void runQuery(text)
  }

  // Enter envía; Shift+Enter hace salto de línea
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      e.currentTarget.form?.requestSubmit()
    }
  }

  const handleReset = () => {
    if (loading) return
    setTurns([])
    setPending(null)
    setError(null)
    setPrompt("")
  }

  // Marca el turno como guardado (se conserva aunque recargues la página)
  const handleSaved = (turnId: string) => {
    setTurns((prev) => prev.map((t) => (t.id === turnId ? { ...t, saved: true } : t)))
  }

  const hasConversation = turns.length > 0
  const canSubmit = !loading && prompt.trim().length >= MIN_LENGTH

  return (
    <div className="bg-[radial-gradient(ellipse_at_top,rgb(139_47_232/0.16),transparent_60%)]">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <header className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-purple-600 bg-purple-900/20 shadow-[0_0_32px_rgb(139_47_232/0.45)]">
            <Bot className="h-8 w-8 text-purple-400" />
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-purple-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-purple-500" />
            TechForge AI · en línea
          </p>
          <h1 className="mt-3 text-4xl font-bold">
            Smart <span className="text-metal">Builder</span>
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-500">
            Cuéntame para qué usarás tu PC y tu presupuesto. Armaré una configuración compatible
            con productos de nuestro catálogo y después puedes pedirme ajustes.
          </p>
        </header>

        {/* Entrada */}
        <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-3xl">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-[0_0_40px_rgb(139_47_232/0.08)] transition-colors focus-within:border-purple-600">
            <label htmlFor="builder-prompt" className="sr-only">
              Describe la PC que necesitas
            </label>
            <textarea
              id="builder-prompt"
              rows={3}
              maxLength={MAX_LENGTH}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                hasConversation
                  ? "Pide un cambio: ej. cambia la tarjeta gráfica por una más barata..."
                  : "Ej: Quiero una PC para jugar a 1440p por 4000 soles..."
              }
              className="w-full resize-none bg-transparent text-gray-100 outline-none placeholder:text-zinc-600"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-600">
                {prompt.length}/{MAX_LENGTH}
              </span>
              <div className="flex items-center gap-3">
                {(hasConversation || pending !== null) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-black px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:border-purple-700 hover:text-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Nueva conversación
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="bg-metal glow-purple inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale"
                >
                  <Send className="h-4 w-4" />
                  {hasConversation ? "Enviar" : "Analizar"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {(hasConversation ? FOLLOW_UPS : EXAMPLES).map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setPrompt(example)}
                className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-purple-700 hover:text-purple-400"
              >
                {example}
              </button>
            ))}
          </div>

          {hasConversation && (
            <p className="mt-3 text-center text-xs text-zinc-600">
              Estás ajustando tu armado actual. Para una PC distinta, pulsa «Nueva conversación».
            </p>
          )}
        </form>

        {/* Conversación */}
        {(hasConversation || pending !== null) && (
          <div className="mt-12 space-y-12">
            {turns.map((turn, index) => (
              <div
                key={turn.id}
                ref={index === turns.length - 1 ? lastTurnRef : undefined}
                className="scroll-mt-24 space-y-6"
              >
                <UserBubble text={turn.prompt} />
                <TurnAnswer turn={turn} onSaved={handleSaved} />
              </div>
            ))}

            {/* Consulta en curso o fallida */}
            {pending !== null && (
              <div ref={pendingRef} className="scroll-mt-24 space-y-6">
                <UserBubble text={pending} />

                {loading && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-5 rounded-xl border border-purple-700/40 bg-zinc-950 p-6"
                  >
                    <div className="relative h-14 w-14 shrink-0">
                      <span className="absolute inset-0 animate-ping rounded-full bg-purple-600/30" />
                      <span className="absolute inset-0 animate-spin rounded-full border-2 border-purple-900 border-t-purple-500" />
                      <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-mono text-xs uppercase tracking-widest text-purple-500">
                        Procesando
                      </p>
                      <p className="mt-1 text-gray-100">{LOADING_STEPS[step]}</p>
                    </div>
                  </div>
                )}

                {error && !loading && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300"
                  >
                    <p>{error}</p>
                    <button
                      type="button"
                      onClick={() => void runQuery(pending)}
                      className="mt-3 rounded-md border border-purple-600 bg-black px-4 py-2 font-semibold text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300"
                    >
                      Reintentar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}