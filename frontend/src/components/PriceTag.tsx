import { formatPrice } from "@/lib/format"
import type { Product } from "@/types"

type PricedProduct = Pick<
  Product,
  "price" | "original_price" | "discount_percent" | "promotion_name"
>

interface PriceTagProps {
  product: PricedProduct
  size?: "card" | "detail"
}

const FINAL_CLASS = {
  card: "text-xl font-bold text-gray-100",
  detail: "text-metal text-4xl font-bold",
}

const ORIGINAL_CLASS = {
  card: "text-sm",
  detail: "text-lg",
}

// Etiqueta "-15%". No se pinta si el producto no está en oferta.
export function DiscountBadge({
  percent,
  className = "",
}: {
  percent: number
  className?: string
}) {
  if (percent <= 0) return null
  return (
    <span
      className={`bg-metal glow-purple inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${className}`}
    >
      -{percent}%
    </span>
  )
}

// Precio final y, si hay oferta, el precio original tachado.
// `price` ya es lo que se paga; `original_price` es el de lista.
export default function PriceTag({ product, size = "card" }: PriceTagProps) {
  const onSale = product.discount_percent > 0
  // En centavos para evitar errores de coma flotante
  const savings =
    (Math.round(Number(product.original_price) * 100) -
      Math.round(Number(product.price) * 100)) /
    100

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className={FINAL_CLASS[size]}>{formatPrice(product.price)}</span>
        {onSale && (
          <>
            <span className={`${ORIGINAL_CLASS[size]} text-zinc-500 line-through`}>
              <span className="sr-only">Precio original: </span>
              {formatPrice(product.original_price)}
            </span>
            {size === "detail" && <DiscountBadge percent={product.discount_percent} />}
          </>
        )}
      </div>

      {onSale && size === "detail" && (
        <p className="mt-2 text-sm text-purple-300">
          {product.promotion_name ? `${product.promotion_name} · ` : ""}
          Ahorras {formatPrice(savings)}
        </p>
      )}
    </div>
  )
}