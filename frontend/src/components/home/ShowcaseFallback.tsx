import { Link } from "react-router-dom"

import { categoryUrl } from "@/components/home/home-utils"
import { SHOWCASE_ITEMS } from "@/components/home/showcase-data"

// Versión sencilla (sin 3D) para equipos sin WebGL o con "reducir movimiento"
export default function ShowcaseFallback() {
  return (
    <section
      aria-label="Explora por categorías"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <h2 className="mb-8 text-center text-3xl font-bold">
        Explora por <span className="text-metal">categorías</span>
      </h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {SHOWCASE_ITEMS.map((item) => (
          <li key={item.slug}>
            <Link
              to={categoryUrl(item.slug)}
              className="block h-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition-colors hover:border-purple-600 hover:bg-purple-900/10"
            >
              <p className="font-semibold text-gray-100">{item.name}</p>
              <p className="mt-1 text-xs text-zinc-500">{item.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}