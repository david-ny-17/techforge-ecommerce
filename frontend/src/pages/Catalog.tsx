import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

import ProductCard from "@/components/ProductCard"
import { getProducts } from "@/services/api"
import type { Product } from "@/types"

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await getProducts()
        if (cancelled) return
        setProducts(data.results)
        setTotal(data.count)
      } catch {
        if (!cancelled) {
          setError("No se pudieron cargar los productos. Verifica que el servidor esté activo.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          Catálogo de <span className="text-metal">Productos</span>
        </h1>
        {!loading && !error && (
          <p className="mt-1 text-sm text-zinc-500">
            {total} {total === 1 ? "producto" : "productos"}
          </p>
        )}
      </header>

      {loading && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p>Cargando productos...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="py-20 text-center text-zinc-500">Aún no hay productos disponibles.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}