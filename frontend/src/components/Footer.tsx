import { Link } from "react-router-dom"
import { Cpu } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-black">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:px-6 md:flex-row lg:px-8">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-purple-500" />
          <span className="font-semibold text-gray-400">
            Tech<span className="text-metal">Forge</span>
          </span>
        </div>

        <ul className="flex items-center gap-6 text-sm text-zinc-500">
          <li>
            <Link to="/catalog" className="transition-colors hover:text-purple-500">
              Catálogo
            </Link>
          </li>
          <li>
            <Link to="/builder" className="transition-colors hover:text-purple-500">
              Smart Builder
            </Link>
          </li>
          <li>
            <Link to="/login" className="transition-colors hover:text-purple-500">
              Mi cuenta
            </Link>
          </li>
        </ul>

        <p className="text-sm text-zinc-600">
          © {new Date().getFullYear()} TechForge. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}