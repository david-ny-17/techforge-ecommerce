import { Bot, Send, Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { FormEvent, KeyboardEvent } from "react"

import ProductCard from "@/components/ProductCard"
import { parseSmartBuilderError } from "@/lib/errors"
import { formatPrice } from "@/lib/format"
import { askSmartBuilder } from "@/services/api"
import type { Product, SmartBuilderResponse } from "@/types"

// Deben coincidir con las validaciones del backend (SmartBuilderRequestSerializer)
const MIN_LENGTH = 10
const MAX_LENGTH = 600

const EXAMPLES = [
  "Quiero una PC para jugar a 1440p por 4000 soles",
  "PC para programar y editar video con presupuesto de 3000 soles",
  "Equipo económico de oficina por 1500 soles",
]

const LOADING_STEPS = [
  "Analizando compatibilidad y cuellos de botella...",
  "Revisando el catálogo de TechForge...",
  "Cruzando sockets, memoria y consumo eléctrico...",
  "Optimizando tu presupuesto...",
  "Preparando tu configuración...",
]

// Suma en centavos para evitar errores de coma flotante
const sumPrices = (products: Product[]) =>
  products.reduce((sum, p) => sum + Math.round(Number(p.price) * 100), 0) / 100

export default function SmartBuilder() {
  const [prompt, setPrompt] = useState("")
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SmartBuilderResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const resultRef = useRef<HTMLDivElement>(null)

  // Rota los mensajes de carga y se queda en el último
  useEffect(() => {
    if (!loading) return
    const timer = window.setInterval(() => {
      setStep((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1))
    }, 2500)
    return () => window.clearInterval(timer)
  }, [loading])

  // Al llegar la respuesta, lleva la vista al resultado
  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [result])

  const runQuery = async (text: string) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setStep(0)
    setSubmittedPrompt(text)
    try {
      setResult(await askSmartBuilder(text))
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
            con productos de nuestro catálogo.
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
              placeholder="Ej: Quiero una PC para jugar a 1440p por 4000 soles..."
              className="w-full resize-none bg-transparent text-gray-100 outline-none placeholder:text-zinc-600"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-600">
                {prompt.length}/{MAX_LENGTH}
              </span>
              <button
                type="submit"
                disabled={!canSubmit}
                className="bg-metal glow-purple inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale"
              >
                <Send className="h-4 w-4" />
                Analizar
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((example) => (
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
        </form>

        {/* Conversación */}
        {submittedPrompt && (
          <div ref={resultRef} className="mt-12 scroll-mt-24 space-y-6">
            <div className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm border border-purple-700/50 bg-purple-900/20 px-4 py-3 text-sm text-gray-100">
                {submittedPrompt}
              </p>
            </div>

            {/* Cargando */}
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

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300"
              >
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void runQuery(submittedPrompt)}
                  className="mt-3 rounded-md border border-purple-600 bg-black px-4 py-2 font-semibold text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Respuesta */}
            {result && (
              <>
                <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-5 py-3">
                    <Bot className="h-4 w-4 text-purple-500" />
                    <span className="font-mono text-xs uppercase tracking-widest text-purple-500">
                      TechForge AI
                    </span>
                  </div>

                  <p className="whitespace-pre-line px-5 py-4 leading-relaxed text-zinc-200">
                    {result.message}
                  </p>

                  {result.products.length > 0 && (
                    <div className="flex items-end justify-between gap-4 border-t border-zinc-800 px-5 py-4">
                      <span className="text-sm text-zinc-400">
                        Total estimado{" "}
                        <span className="text-zinc-600">(1 unidad de cada producto)</span>
                      </span>
                      <span className="text-metal text-2xl font-bold">
                        {formatPrice(sumPrices(result.products))}
                      </span>
                    </div>
                  )}
                </div>

                {result.products.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-purple-500">
                      Componentes recomendados ({result.products.length})
                    </h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {result.products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}