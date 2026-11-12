import axios from "axios"
import { ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react"
import { useEffect, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
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

// Opciones de orden (el valor es el que entiende la API; "" = más recientes)
const ORDERING_OPTIONS = [
  { value: "", label: "Más recientes" },
  { value: "price", label: "Precio: menor a mayor" },
  { value: "-price", label: "Precio: mayor a menor" },
  { value: "name", label: "Nombre: A-Z" },
  { value: "-name", label: "Nombre: Z-A" },
]
const VALID_ORDERINGS = ORDERING_OPTIONS.map((option) => option.value)

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-gray-100 placeholder:text-zinc-600 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 disabled:opacity-50"

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

// Solo acepta enteros no negativos; cualquier otra cosa escrita en la URL se ignora
const cleanPrice = (value: string | null) => (value && /^\d{1,7}$/.test(value) ? value : "")

interface Filters {
  search: string
  ordering: string
  minPrice: string
  maxPrice: string
  inStock: boolean
}

interface CatalogResult {
  key: string // identifica a qué consulta pertenece este resultado
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

interface FiltersBarProps {
  applied: Filters
  hasActive: boolean
  onApply: (filters: Filters) => void
  onClear: () => void
}

// Buscador, precios, orden y stock. Los textos que se escriben viven aquí como
// borrador; solo se envían a la URL al pulsar Enter o "Aplicar".
function FiltersBar({ applied, hasActive, onApply, onClear }: FiltersBarProps) {
  const [search, setSearch] = useState(applied.search)
  const [minPrice, setMinPrice] = useState(applied.minPrice)
  const [maxPrice, setMaxPrice] = useState(applied.maxPrice)
  const [priceError, setPriceError] = useState<string | null>(null)

  const handlePriceChange =
    (setter: (value: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value.replace(/\D/g, "").slice(0, 7))
      setPriceError(null)
    }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      setPriceError("El precio mínimo no puede ser mayor que el máximo.")
      return
    }
    setPriceError(null)
    onApply({ ...applied, search: search.trim(), minPrice, maxPrice })
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="mb-6 space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          enterKeyHint="search"
          aria-label="Buscar productos"
          placeholder="Buscar por nombre o descripción..."
          maxLength={100}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${INPUT_CLASS} pl-9`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <label className="block text-xs text-zinc-500">
          Precio mínimo (S/)
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={minPrice}
            onChange={handlePriceChange(setMinPrice)}
            className={`${INPUT_CLASS} mt-1`}
          />
        </label>

        <label className="block text-xs text-zinc-500">
          Precio máximo (S/)
          <input
            type="text"
            inputMode="numeric"
            placeholder="Sin límite"
            value={maxPrice}
            onChange={handlePriceChange(setMaxPrice)}
            className={`${INPUT_CLASS} mt-1`}
          />
        </label>

        <label className="col-span-2 block text-xs text-zinc-500 md:col-span-1">
          Ordenar por
          <select
            value={applied.ordering}
            onChange={(e) => onApply({ ...applied, ordering: e.target.value })}
            className={`${INPUT_CLASS} mt-1 [color-scheme:dark]`}
          >
            {ORDERING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="bg-metal glow-purple col-span-2 self-end rounded-lg px-4 py-2 text-sm font-semibold text-white md:col-span-1"
        >
          Aplicar
        </button>
      </div>

      {priceError && (
        <p role="alert" className="text-sm text-red-300">
          {priceError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={applied.inStock}
            onChange={(e) => onApply({ ...applied, inStock: e.target.checked })}
            className="h-4 w-4 accent-purple-600"
          />
          Solo con stock
        </label>

        {hasActive && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-purple-400"
          >
            <X className="h-4 w-4" />
            Limpiar filtros
          </button>
        )}
      </div>
    </form>
  )
}

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categorySlug = searchParams.get("category") ?? ""
  const page = Math.max(1, Math.floor(Number(searchParams.get("page"))) || 1)

  // Filtros leídos de la URL (valores inválidos se ignoran)
  const search = (searchParams.get("search") ?? "").trim().slice(0, 100)
  const rawOrdering = searchParams.get("ordering") ?? ""
  const ordering = VALID_ORDERINGS.includes(rawOrdering) ? rawOrdering : ""
  const minPrice = cleanPrice(searchParams.get("min_price"))
  const maxPrice = cleanPrice(searchParams.get("max_price"))
  const inStock = searchParams.get("in_stock") === "true"

  const applied: Filters = { search, ordering, minPrice, maxPrice, inStock }
  const hasActiveFilters = search !== "" || ordering !== "" || minPrice !== "" || maxPrice !== "" || inStock
  const hasResultFilters = search !== "" || minPrice !== "" || maxPrice !== "" || inStock

  const queryKey = [categorySlug, page, search, ordering, minPrice, maxPrice, inStock].join("|")

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

  // Productos: se vuelve a pedir cuando cambia cualquier parte de la consulta
  useEffect(() => {
    let cancelled = false

    getProducts({
      page,
      category_slug: categorySlug || undefined,
      search: search || undefined,
      ordering: ordering || undefined,
      min_price: minPrice ? Number(minPrice) : undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined,
      in_stock: inStock || undefined,
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
  }, [categorySlug, page, search, ordering, minPrice, maxPrice, inStock, queryKey])

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

  const selectCategory = (slug: string) => updateParams({ category: slug || undefined })

  const applyFilters = (filters: Filters) =>
    updateParams({
      search: filters.search || undefined,
      ordering: filters.ordering || undefined,
      min_price: filters.minPrice || undefined,
      max_price: filters.maxPrice || undefined,
      in_stock: filters.inStock ? "true" : undefined,
    })

  const clearFilters = () =>
    updateParams({
      search: undefined,
      ordering: undefined,
      min_price: undefined,
      max_price: undefined,
      in_stock: undefined,
    })

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
            {search && ` para "${search}"`}
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
          {/* Se vuelve a montar solo si cambian el texto o los precios aplicados
              (limpiar filtros, botón Atrás); así el borrador siempre coincide con la URL */}
          <FiltersBar
            key={`${search}|${minPrice}|${maxPrice}`}
            applied={applied}
            hasActive={hasActiveFilters}
            onApply={applyFilters}
            onClear={clearFilters}
          />

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
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <p className="text-zinc-500">
                {hasResultFilters
                  ? "No encontramos productos con esos filtros."
                  : "No hay productos en esta categoría todavía."}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-md border border-purple-600 bg-black px-4 py-2 text-sm font-semibold text-purple-400 transition-colors hover:bg-purple-900/20"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
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