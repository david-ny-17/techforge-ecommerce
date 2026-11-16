import { Bookmark, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import AddAllBar from "@/components/AddAllBar"
import { sumPrices } from "@/lib/build-utils"
import { parseApiError } from "@/lib/errors"
import { formatPrice } from "@/lib/format"
import { deleteSavedBuild, getSavedBuilds } from "@/services/api"
import type { SavedBuild } from "@/types"

function BuildCard({
  build,
  onDelete,
}: {
  build: SavedBuild
  onDelete: (id: number) => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const total = sumPrices(build.products)
  const budget = build.budget === null ? null : Number(build.budget)
  const overBudget = budget !== null && total > budget
  const date = new Date(build.created_at).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(build.id)
    setDeleting(false)
    setConfirming(false)
  }

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <header className="flex flex-col gap-3 border-b border-zinc-800 bg-zinc-900 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-gray-100">{build.name}</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Guardado el {date}
            {build.prompt ? ` · «${build.prompt}»` : ""}
          </p>
        </div>

        {confirming ? (
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm text-zinc-400">¿Eliminar?</span>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-1.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-950/60 disabled:opacity-50"
            >
              {deleting ? "Eliminando..." : "Sí, eliminar"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="rounded-md border border-zinc-800 bg-black px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-purple-400 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Eliminar armado ${build.name}`}
            title="Eliminar armado"
            className="inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        )}
      </header>

      <ul className="divide-y divide-zinc-800">
        {build.products.map((product) => (
          <li key={product.id} className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-purple-500">
                {product.category.name}
              </p>
              <Link
                to={`/product/${product.slug}`}
                className="block truncate text-sm text-gray-100 transition-colors hover:text-purple-400"
              >
                {product.name}
              </Link>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-gray-100">
                {formatPrice(Number(product.price))}
              </p>
              {product.stock === 0 && <p className="text-xs text-red-400">Sin stock</p>}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-end justify-between gap-4 border-t border-zinc-800 px-5 py-4">
        <div className="text-sm text-zinc-400">
          Total actual <span className="text-zinc-600">(1 unidad de cada producto)</span>
          {budget !== null && (
            <span className={`block text-xs ${overBudget ? "text-red-400" : "text-zinc-600"}`}>
              Presupuesto: {formatPrice(budget)}
              {overBudget ? " · los precios actuales lo superan" : ""}
            </span>
          )}
        </div>
        <span className="text-metal text-2xl font-bold">{formatPrice(total)}</span>
      </div>

      <AddAllBar products={build.products} />
    </article>
  )
}

export default function SavedBuilds() {
  const [builds, setBuilds] = useState<SavedBuild[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    getSavedBuilds()
      .then((data) => {
        if (!cancelled) setBuilds(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(parseApiError(err, "No se pudieron cargar tus armados.").message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const handleRetry = () => {
    setLoadError(null)
    setBuilds(null)
    setReloadKey((key) => key + 1)
  }

  const handleDelete = async (id: number) => {
    setActionError(null)
    try {
      await deleteSavedBuild(id)
      setBuilds((prev) => (prev ? prev.filter((build) => build.id !== id) : prev))
    } catch (err) {
      setActionError(parseApiError(err, "No se pudo eliminar el armado.").message)
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 flex items-center gap-3">
        <Bookmark className="h-7 w-7 text-purple-500" />
        <h1 className="text-3xl font-bold">
          Mis <span className="text-metal">armados</span>
        </h1>
      </header>

      {actionError && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300"
        >
          {actionError}
        </div>
      )}

      {loadError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300"
        >
          <p>{loadError}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-3 rounded-md border border-purple-600 bg-black px-4 py-2 font-semibold text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300"
          >
            Reintentar
          </button>
        </div>
      ) : builds === null ? (
        <div role="status" className="flex items-center gap-3 text-zinc-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-purple-900 border-t-purple-500" />
          Cargando tus armados...
        </div>
      ) : builds.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8 text-center">
          <p className="text-zinc-300">Aún no tienes armados guardados.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Genera uno con el Smart Builder y pulsa «Guardar armado».
          </p>
          <Link
            to="/builder"
            className="bg-metal glow-purple mt-5 inline-block rounded-lg px-5 py-2.5 font-semibold text-white"
          >
            Ir al Smart Builder
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {builds.map((build) => (
            <BuildCard key={build.id} build={build} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </section>
  )
}