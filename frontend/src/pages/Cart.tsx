import { ArrowLeft, ImageOff, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

import { useCart } from "@/context/useCart"
import { formatPrice } from "@/lib/format"

export default function Cart() {
  const { cart, totalItems, updateQuantity, removeFromCart, clearCart, getCartTotal } =
    useCart()

  // Carrito vacío
  if (cart.length === 0) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
        <ShoppingBag className="h-16 w-16 text-zinc-700" />
        <h1 className="text-2xl font-bold text-gray-100">Tu carrito está vacío</h1>
        <p className="text-zinc-500">
          Aún no has añadido productos. Explora el catálogo y arma tu setup ideal.
        </p>
        <Link
          to="/catalog"
          className="mt-2 inline-flex items-center gap-2 rounded-md border border-purple-600 bg-black px-6 py-3 font-semibold text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Tu <span className="text-metal">Carrito</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-sm text-zinc-500 transition-colors hover:text-red-400"
        >
          Vaciar carrito
        </button>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Lista de productos */}
        <ul className="flex flex-col gap-4 lg:col-span-2">
          {cart.map((item) => (
            <li
              key={item.id}
              className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <Link
                to={`/product/${item.slug}`}
                className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-950"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <ImageOff className="h-8 w-8 text-zinc-700" />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/product/${item.slug}`}
                      className="line-clamp-2 font-semibold text-gray-100 transition-colors hover:text-purple-500"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-zinc-500">
                      {formatPrice(item.price)} c/u
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Eliminar ${item.name}`}
                    className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  {/* Control de cantidad */}
                  <div className="inline-flex items-center rounded-md border border-zinc-700 bg-black">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label="Disminuir cantidad"
                      className="p-2 text-gray-300 transition-colors hover:text-purple-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-gray-300"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-gray-100">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      aria-label="Aumentar cantidad"
                      className="p-2 text-gray-300 transition-colors hover:text-purple-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-gray-300"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-lg font-bold text-gray-100">
                    {formatPrice(Number(item.price) * item.quantity)}
                  </p>
                </div>

                {item.quantity >= item.stock && (
                  <p className="text-xs text-purple-400">
                    Alcanzaste el stock disponible ({item.stock}).
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Resumen */}
        <aside className="h-fit rounded-xl border border-zinc-800 bg-zinc-900 p-6 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-purple-500">
            Resumen del pedido
          </h2>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between text-zinc-400">
              <dt>Artículos</dt>
              <dd className="text-gray-100">{totalItems}</dd>
            </div>
          </dl>

          <div className="my-4 border-t border-zinc-800" />

          <div className="flex items-end justify-between">
            <span className="text-zinc-400">Total a pagar</span>
            <span className="text-metal text-3xl font-bold">
              {formatPrice(getCartTotal())}
            </span>
          </div>

          <Link
            to="/checkout"
            className="bg-metal glow-purple mt-6 block rounded-lg px-6 py-4 text-center text-lg font-bold text-white"
          >
            Proceder al Pago
          </Link>

          <Link
            to="/catalog"
            className="mt-3 block text-center text-sm text-zinc-500 transition-colors hover:text-purple-500"
          >
            Seguir comprando
          </Link>
        </aside>
      </div>
    </section>
  )
}