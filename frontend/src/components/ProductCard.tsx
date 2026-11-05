import { ImageOff } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import AddToCartButton from "@/components/AddToCartButton"
import { formatPrice, getProductImage } from "@/lib/format"
import type { Product } from "@/types"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const image = getProductImage(product)
  const outOfStock = product.stock === 0
  const detailUrl = `/product/${product.slug}`
  const location = useLocation()
  const from = location.pathname + location.search

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-all duration-200 hover:border-purple-600 hover:shadow-[0_0_24px_rgb(139_47_232/0.25)]">
      {/* Zona clicable: imagen + datos */}
      <Link to={detailUrl} state={{ from }} className="flex flex-1 flex-col">
        <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-700">
              <ImageOff className="h-12 w-12" />
            </div>
          )}
          {outOfStock && (
            <span className="absolute left-3 top-3 rounded-full bg-black/80 px-2.5 py-1 text-xs font-medium text-zinc-300">
              Agotado
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 pb-2">
          <div className="flex-1">
            <span className="text-xs font-medium uppercase tracking-wider text-purple-500">
              {product.category.name}
            </span>
            <h3 className="mt-1 line-clamp-2 text-base font-semibold text-gray-100">
              {product.name}
            </h3>
          </div>
          <p className="text-xl font-bold text-gray-100">{formatPrice(product.price)}</p>
        </div>
      </Link>

      {/* Acciones */}
      <div className="flex items-center gap-2 p-4 pt-2">
        <Link
          to={detailUrl}
          state={{ from }}
          className="flex-1 rounded-md border border-purple-600 bg-black px-4 py-2 text-center text-sm font-semibold text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300"
        >
          Ver detalles
        </Link>
        <AddToCartButton product={product} variant="icon" />
      </div>
    </div>
  )
}