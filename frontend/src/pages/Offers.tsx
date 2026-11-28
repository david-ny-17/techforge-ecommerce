import axios from "axios"
import { ChevronLeft, ChevronRight, Loader2, PackageOpen } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import Countdown from "@/components/Countdown"
import ProductCard from "@/components/ProductCard"
import { getServerOffset } from "@/lib/use-countdown"
import { getProducts, getPromotions } from "@/services/api"
import type { Product, Promotion, PromotionCategory } from "@/types"

// Debe coincidir con PAGE_SIZE en backend/settings.py
const PAGE_SIZE = 12

// Mismos órdenes que entiende la API (el valor "" = más recientes)
const ORDERING_OPTIONS = [
  { value: "", label: "Más recientes" },
  { value: "price", label: "Precio: menor a mayor" },
  { value: "-price", label: "Precio: mayor a menor" },
]
const VALID_ORDERINGS = ORDERING_OPTIONS.map((option) => option.value)

// "5 de diciembre, 11:59 p. m."
const formatEnd = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  })

interface PromoData {
  promotions: Promotion[]
  offsetMs: number
}

interface ProductsResult {
  key: string // identifica a qué consulta pertenece este resultado
  products: Product[]
  total: number
  hasNext: boolean
  hasPrev: boolean
  error: string | null
  outOfRange: boolean
}

interface HeroProps {
  promo: Promotion
  offsetMs: number
  onExpire: () => void
}

// Cabecera tipo "evento" de la oferta principal
function Hero({ promo, offsetMs, onExpire }: HeroProps) {
  const reduceMotion = useReducedMotion()

  return (
    <section
      aria-labelledby="offer-title"
      className="relative overflow-hidden rounded-3xl border border-purple-700/50 bg-black shadow-[0_0_60px_rgb(139_47_232/0.2)]"
    >
      {/* Fondo: malla de puntos que se desvanece y dos resplandores morados */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgb(169 102 255 / 0.16) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(70% 90% at 80% 20%, black, transparent)",
          WebkitMaskImage: "radial-gradient(70% 90% at 80% 20%, black, transparent)",
        }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full"
        style={{
          backgroundImage: "radial-gradient(circle, rgb(139 47 232 / 0.4), transparent 70%)",
        }}
        animate={reduceMotion ? undefined : { opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full"
        style={{
          backgroundImage: "radial-gradient(circle, rgb(91 25 160 / 0.35), transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{
          backgroundImage: "linear-gradient(90deg, transparent, #a966ff, transparent)",
        }}
      />

      <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-purple-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-400" />
            </span>
            Evento activo
          </p>
          <h1 id="offer-title" className="mt-4 text-4xl font-bold text-gray-100 sm:text-5xl">
            {promo.name}
          </h1>
          {promo.description && (
            <p className="mt-3 max-w-xl text-base text-zinc-400">{promo.description}</p>
          )}
          {promo.categories.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {promo.categories.map((category) => (
                <li
                  key={category.id}
                  className="rounded-full border border-purple-700/50 bg-purple-900/20 px-3 py-1 text-xs font-medium text-purple-300"
                >
                  {category.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col items-start gap-6 lg:items-end">
          <div className="lg:text-right">
            <span className="text-metal block text-7xl font-black leading-none sm:text-9xl">
              -{promo.discount_percent}%
            </span>
            <span className="mt-2 block text-sm uppercase tracking-[0.3em] text-zinc-500">
              de descuento
            </span>
          </div>

          <div className="lg:text-right">
            <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">
              La oferta termina en
            </p>
            <Countdown
              endsAt={promo.ends_at}
              serverOffsetMs={offsetMs}
              size="lg"
              onExpire={onExpire}
            />
            <p className="mt-3 text-xs text-zinc-500">Hasta el {formatEnd(promo.ends_at)}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Offers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categorySlug = searchParams.get("category") ?? ""
  const page = Math.max(1, Math.floor(Number(searchParams.get("page"))) || 1)
  const rawOrdering = searchParams.get("ordering") ?? ""
  const ordering = VALID_ORDERINGS.includes(rawOrdering) ? rawOrdering : ""

  // Sube al terminar una oferta o al pulsar "Reintentar": vuelve a pedir todo
  const [attempt, setAttempt] = useState(0)
  const [promoData, setPromoData] = useState<PromoData | null>(null)
  const [promoError, setPromoError] = useState(false)
  const [result, setResult] = useState<ProductsResult | null>(null)

  const queryKey = [categorySlug, page, ordering, attempt].join("|")

  // "Cargando" = el último resultado guardado no corresponde a la consulta actual
  const loading = result?.key !== queryKey

  // Ofertas vigentes
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
        setPromoData({ promotions: live, offsetMs })
        setPromoError(false)
      })
      .catch(() => {
        if (!cancelled) setPromoError(true)
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  // Productos en oferta
  useEffect(() => {
    let cancelled = false

    getProducts({
      page,
      category_slug: categorySlug || undefined,
      ordering: ordering || undefined,
      on_sale: true,
    })
      .then((data) => {
        if (cancelled) return
        setResult({
          key: queryKey,
          products: data.results,
          total: data.count,
          hasNext: data.next !== null,
          hasPrev: data.previous !== null,
          error: null,
          outOfRange: false,
        })
      })
      .catch((err) => {
        if (cancelled) return
        // DRF responde 404 cuando se pide una página que no existe
        const outOfRange = axios.isAxiosError(err) && err.response?.status === 404
        setResult({
          key: queryKey,
          products: [],
          total: 0,
          hasNext: false,
          hasPrev: false,
          error: outOfRange
            ? "Esa página no existe."
            : "No se pudieron cargar los productos. Verifica que el servidor esté activo.",
          outOfRange,
        })
      })

    return () => {
      cancelled = true
    }
  }, [categorySlug, page, ordering, queryKey])

  const handleExpire = useCallback(() => setAttempt((n) => n + 1), [])

  const retry = () => {
    setPromoError(false)
    setAttempt((n) => n + 1)
  }

  // Categorías que tienen alguna oferta vigente (sin repetir)
  const chips = useMemo(() => {
    const unique = new Map<number, PromotionCategory>()
    for (const promo of promoData?.promotions ?? []) {
      for (const category of promo.categories) unique.set(category.id, category)
    }
    return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, "es"))
  }, [promoData])

  // Cambia parámetros de la URL conservando el resto; por defecto vuelve a la página 1
  const updateParams = (changes: Record<string, string | undefined>, resetPage = true) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (resetPage) next.delete("page")
    setSearchParams(next)
  }

  const goToPage = (target: number) => {
    const next = new URLSearchParams(searchParams)
    if (target <= 1) next.delete("page")
    else next.set("page", String(target))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const total = result?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // ---------- Estados de la página ----------
  if (promoError && !promoData) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
          <p>No se pudieron cargar las ofertas. Verifica que el servidor esté activo.</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 rounded-md border border-purple-600 bg-black px-4 py-2 font-semibold text-purple-400 transition-colors hover:bg-purple-900/20"
          >
            Reintentar
          </button>
        </div>
      </section>
    )
  }

  if (!promoData) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p>Cargando ofertas...</p>
      </div>
    )
  }

  if (promoData.promotions.length === 0) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
        <PackageOpen className="h-16 w-16 text-zinc-700" />
        <h1 className="text-2xl font-bold text-gray-100">
          Ofertas <span className="text-metal">TechForge</span>
        </h1>
        <p className="text-zinc-500">
          Por ahora no hay ofertas vigentes. Vuelve pronto: las próximas aparecerán aquí.
        </p>
        <Link
          to="/catalog"
          className="bg-metal glow-purple mt-2 rounded-lg px-6 py-3 font-bold text-white"
        >
          Explorar el catálogo
        </Link>
      </section>
    )
  }

  const [featured, ...others] = promoData.promotions

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Hero promo={featured} offsetMs={promoData.offsetMs} onExpire={handleExpire} />

      {others.length > 0 && (
        <section aria-label="Otras ofertas vigentes" className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-purple-500">
            También vigentes
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((promo) => (
              <li
                key={promo.id}
                className="flex items-center gap-4 rounded-xl border border-purple-700/40 bg-zinc-950 p-4"
              >
                <span className="text-metal shrink-0 text-3xl font-black leading-none">
                  -{promo.discount_percent}%
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-100">{promo.name}</p>
                  <p className="text-xs text-zinc-500">Hasta el {formatEnd(promo.ends_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="offers-products" className="mt-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="offers-products" className="text-2xl font-bold">
              Productos en <span className="text-metal">oferta</span>
            </h2>
            {!loading && !result?.error && (
              <p className="mt-1 text-sm text-zinc-500">
                {total} {total === 1 ? "producto" : "productos"}
              </p>
            )}
          </div>

          <label className="block text-xs text-zinc-500">
            Ordenar por
            <select
              value={ordering}
              onChange={(e) => updateParams({ ordering: e.target.value || undefined })}
              className="mt-1 block rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-gray-100 [color-scheme:dark] focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
            >
              {ORDERING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {chips.length > 0 && (
          <nav aria-label="Categorías en oferta" className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {[{ id: 0, name: "Todas", slug: "" }, ...chips].map((chip) => {
              const active = categorySlug === chip.slug
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => updateParams({ category: chip.slug || undefined })}
                  aria-current={active ? "true" : undefined}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-purple-600 bg-purple-900/20 text-purple-300"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-purple-700 hover:text-purple-400"
                  }`}
                >
                  {chip.name}
                </button>
              )
            })}
          </nav>
        )}

        {loading && (
          <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <p>Cargando productos...</p>
          </div>
        )}

        {!loading && result?.error && (
          <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
            <p>{result.error}</p>
            {result.outOfRange && (
              <button
                type="button"
                onClick={() => goToPage(1)}
                className="mt-3 rounded-md border border-purple-600 bg-black px-4 py-2 font-semibold text-purple-400 transition-colors hover:bg-purple-900/20"
              >
                Ir a la primera página
              </button>
            )}
          </div>
        )}

        {!loading && result && !result.error && result.products.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-zinc-500">No hay productos en oferta en esta categoría.</p>
            {categorySlug && (
              <button
                type="button"
                onClick={() => updateParams({ category: undefined })}
                className="rounded-md border border-purple-600 bg-black px-4 py-2 text-sm font-semibold text-purple-400 transition-colors hover:bg-purple-900/20"
              >
                Ver todas las ofertas
              </button>
            )}
          </div>
        )}

        {!loading && result && result.products.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {result.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Paginación */}
            <nav
              aria-label="Paginación"
              className="mt-10 flex items-center justify-between gap-4 border-t border-zinc-800 pt-6"
            >
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={!result.hasPrev}
                className="inline-flex items-center gap-1 rounded-md border border-purple-600 bg-black px-4 py-2 text-sm font-semibold text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600 disabled:hover:bg-black"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>

              <span className="text-sm text-zinc-500">
                Página <span className="font-semibold text-gray-100">{page}</span> de {totalPages}
              </span>

              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={!result.hasNext}
                className="inline-flex items-center gap-1 rounded-md border border-purple-600 bg-black px-4 py-2 text-sm font-semibold text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600 disabled:hover:bg-black"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          </>
        )}
      </section>
    </div>
  )
}