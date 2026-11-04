import { ImageOff } from "lucide-react"
import { Link } from "react-router-dom"

import { formatPrice, getProductImage } from "@/lib/format"
import type { Product } from "@/types"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const image = getProductImage(product)
  const outOfStock = product.stock === 0

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-all duration-200 hover:border-purple-600 hover:shadow-[0_0_24px_rgb(139_47_232/0.25)]"
    >
      {/* Imagen */}
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

      {/* Contenido */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1">
          <span className="text-xs font-medium uppercase tracking-wider text-purple-500">
            {product.category.name}
          </span>
          <h3 className="mt-1 line-clamp-2 text-base font-semibold text-gray-100">
            {product.name}
          </h3>
        </div>

        <p className="text-xl font-bold text-gray-100">{formatPrice(product.price)}</p>

        <span className="bg-metal glow-purple rounded-md px-4 py-2 text-center text-sm font-semibold text-white">
          Ver detalles
        </span>
      </div>
    </Link>
  )
}