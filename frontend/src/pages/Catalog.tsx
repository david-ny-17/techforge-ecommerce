import axios from "axios"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

import ProductCard from "@/components/ProductCard"
import { getCategories, getProducts } from "@/services/api"
import type { Category, Product } from "@/types"

// Debe coincidir con PAGE_SIZE en backend/settings.py
const PAGE_SIZE = 12

// Orden en que se muestran las categorías en el sidebar
const CATEGORY_ORDER = [
  "Procesadores",
  "Placas madre",
  "Memoria RAM",
  "Tarjetas gráficas",
  "Almacenamiento",
  "Fuentes de poder",
  "Gabinetes",
  "Refrigeración",
  "Monitores",
  "Teclados",
  "Mouses",
  "Audífonos",
  "Micrófonos",
  "Laptops",
  "Accesorios",
]

// Ignora tildes y mayúsculas al comparar nombres
const normalize = (text: string) =>
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

function sortCategories(list: Category[]): Category[] {
  const rank = (c: Category) => {
    const index = CATEGORY_ORDER.findIndex((name) => normalize(name) === normalize(c.name))
    return index === -1 ? CATEGORY_ORDER.length : index
  }
  return [...list].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, "es"))
}

interface CatalogResult {
  key: string // identifica a qué consulta (categoría|página) pertenece este resultado
  products: Product[]
  total: number
  hasNext: boolean
  hasPrev: boolean
  error: string | null
  outOfRange: boolean
}

interface CategoryButtonProps {
  label: string
  active: boolean
  onClick: () => void
}

function CategoryButton({ label, active, onClick }: CategoryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors lg:rounded-md lg:text-left ${
        active
          ? "border-purple-600 bg-purple-900/20 text-purple-300"
          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-purple-700 hover:text-purple-400"
      }`}
    >
      {label}
    </button>
  )
}

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categorySlug = searchParams.get("category") ?? ""
  const page = Math.max(1, Math.floor(Number(searchParams.get("page"))) || 1)
  const queryKey = `${categorySlug}|${page}`

  const [categories, setCategories] = useState<Category[]>([])
  const [result, setResult] = useState<CatalogResult | null>(null)

  // "Cargando" = el último resultado guardado no corresponde a la consulta actual
  const loading = result?.key !== queryKey

  // Categorías (una sola vez)
  useEffect(() => {
    let cancelled = false
    getCategories()
      .then((data) => {
        if (!cancelled) setCategories(sortCategories(data))
      })
      .catch(() => {
        // Sin categorías el catálogo sigue funcionando con "Todos"
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Productos: se vuelve a pedir cuando cambia la categoría o la página
  useEffect(() => {
    let cancelled = false

    getProducts({ page, category_slug: categorySlug || undefined })
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
  }, [categorySlug, page, queryKey])

  const selectCategory = (slug: string) => {
    const next = new URLSearchParams()
    if (slug) next.set("category", slug) // al cambiar de categoría se vuelve a la página 1
    setSearchParams(next)
  }

  const goToPage = (target: number) => {
    const next = new URLSearchParams(searchParams)
    if (target <= 1) next.delete("page")
    else next.set("page", String(target))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const selectedCategory = categories.find((c) => c.slug === categorySlug)
  const total = result?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          {selectedCategory ? (
            <span className="text-metal">{selectedCategory.name}</span>
          ) : (
            <>
              Catálogo de <span className="text-metal">Productos</span>
            </>
          )}
        </h1>
        {!loading && !result?.error && (
          <p className="mt-1 text-sm text-zinc-500">
            {total} {total === 1 ? "producto" : "productos"}
            {selectedCategory && ` en ${selectedCategory.name}`}
          </p>
        )}
      </header>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar de categorías (chips con scroll horizontal en móvil) */}
        <aside className="lg:w-60 lg:shrink-0">
          <div className="lg:sticky lg:top-24">
            <h2 className="mb-3 hidden text-sm font-semibold uppercase tracking-wider text-purple-500 lg:block">
              Categorías
            </h2>
            <nav
              aria-label="Categorías"
              className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
            >
              <CategoryButton
                label="Todos"
                active={categorySlug === ""}
                onClick={() => selectCategory("")}
              />
              {categories.map((category) => (
                <CategoryButton
                  key={category.id}
                  label={category.name}
                  active={categorySlug === category.slug}
                  onClick={() => selectCategory(category.slug)}
                />
              ))}
            </nav>
          </div>
        </aside>

        {/* Contenido */}
        <div className="min-w-0 flex-1">
          {loading && (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-zinc-400">
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
            <p className="py-20 text-center text-zinc-500">
              No hay productos en esta categoría todavía.
            </p>
          )}

          {!loading && result && result.products.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
                  Página <span className="font-semibold text-gray-100">{page}</span> de{" "}
                  {totalPages}
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
        </div>
      </div>
    </section>
  )
}