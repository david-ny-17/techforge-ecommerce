import axios from "axios"
import { ArrowLeft, ImageOff, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import AddToCartButton from "@/components/AddToCartButton"

import {
  formatPrice,
  formatSpecKey,
  formatSpecValue,
  getProductImage,
} from "@/lib/format"
import { getProductBySlug } from "@/services/api"
import type { Product } from "@/types"

export default function ProductDetail() {
  const location = useLocation()
  const stateFrom = (location.state as { from?: string } | null)?.from
  const fromCatalog = stateFrom?.startsWith("/catalog") ? stateFrom : null
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getProductBySlug(slug!)
        if (!cancelled) setProduct(data)
      } catch (err) {
        if (cancelled) return
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError("Este producto no existe o ya no está disponible.")
        } else {
          setError("No se pudo cargar el producto. Verifica que el servidor esté activo.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p>Cargando producto...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-zinc-300">{error ?? "Producto no encontrado."}</p>
        <Link
          to={fromCatalog ?? "/catalog"}
          className="bg-metal glow-purple rounded-md px-5 py-2 font-semibold text-white"
        >
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const image = getProductImage(product)
  const outOfStock = product.stock === 0
  const specs = Object.entries(product.specifications ?? {})
  const backTo = fromCatalog ?? `/catalog?category=${product.category.slug}`

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to={backTo}
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-purple-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Columna izquierda: imagen */}
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-contain p-3"
            />
          ) : (
            <ImageOff className="h-20 w-20 text-zinc-700" />
          )}
        </div>

        {/* Columna derecha: detalles */}
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-sm font-medium uppercase tracking-wider text-purple-500">
              {product.category.name}
            </span>
            <h1 className="mt-2 text-3xl font-bold text-gray-100">{product.name}</h1>
          </div>

          <p className="text-4xl font-bold">
            <span className="text-metal">{formatPrice(product.price)}</span>
          </p>

          <div>
            {outOfStock ? (
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-zinc-400">
                Agotado
              </span>
            ) : (
              <span className="rounded-full border border-purple-700/60 bg-purple-900/20 px-3 py-1 text-sm text-purple-300">
                {product.stock} {product.stock === 1 ? "unidad disponible" : "unidades disponibles"}
              </span>
            )}
          </div>

          {product.description && (
            <p className="leading-relaxed text-zinc-300">{product.description}</p>
          )}

          {/* Especificaciones técnicas */}
          {specs.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-zinc-800">
              <h2 className="border-b border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-purple-500">
                Especificaciones técnicas
              </h2>
              <table className="w-full text-sm">
                <tbody>
                  {specs.map(([key, value]) => (
                    <tr key={key} className="border-b border-zinc-800 last:border-b-0">
                      <th className="w-1/2 bg-zinc-950 px-4 py-3 text-left font-medium text-zinc-400">
                        {formatSpecKey(key)}
                      </th>
                      <td className="px-4 py-3 text-gray-100">{formatSpecValue(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <AddToCartButton product={product} variant="full" />
        </div>
      </div>
    </section>
  )
}