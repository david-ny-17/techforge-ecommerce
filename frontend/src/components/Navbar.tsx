import { useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { Cpu, LogOut, Menu, ShoppingCart, User, X } from "lucide-react"

import { useAuth } from "@/context/useAuth"
import { useCart } from "@/context/useCart"

const navLinks = [
  { to: "/catalog", label: "Catálogo" },
  { to: "/builder", label: "Smart Builder" },
]

const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 pb-1 text-sm font-medium transition-colors hover:text-purple-500 ${
    isActive ? "border-purple-600 text-purple-500" : "border-transparent text-gray-300"
  }`

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-zinc-900 hover:text-purple-500 ${
    isActive ? "bg-zinc-900 text-purple-500" : "text-gray-300"
  }`

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { totalItems: cartCount } = useCart()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const displayName = user ? user.first_name || user.username : ""

  const handleLogout = () => {
    setOpen(false)
    navigate("/")
    logout()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Cpu className="h-6 w-6 text-purple-500" />
          <span className="text-xl font-bold tracking-tight text-gray-100">
            Tech<span className="text-metal">Forge</span>
          </span>
        </Link>

        {/* Enlaces (escritorio) */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={desktopLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Zona derecha */}
        <div className="flex items-center gap-1">
          {/* Cuenta (escritorio) */}
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="flex max-w-[11rem] items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-300 transition-colors hover:bg-zinc-900 hover:text-purple-500"
                >
                  <User className="h-5 w-5 shrink-0" />
                  <span className="truncate">{displayName}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-400 transition-colors hover:bg-zinc-900 hover:text-purple-500"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-purple-500"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="bg-metal glow-purple rounded-md px-4 py-2 text-sm font-semibold text-white"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Carrito */}
          <Link
            to="/cart"
            aria-label="Carrito"
            className="relative rounded-md p-2 text-gray-300 transition-colors hover:bg-zinc-900 hover:text-purple-500"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgb(139_47_232/0.6)]">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {/* Botón hamburguesa (móvil) */}
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setOpen((prev) => !prev)}
            className="rounded-md p-2 text-gray-300 transition-colors hover:bg-zinc-900 hover:text-purple-500 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Menú móvil */}
      {open && (
        <div className="border-t border-zinc-800 bg-black px-4 pb-4 pt-2 md:hidden">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={mobileLinkClass}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}

          <div className="my-2 border-t border-zinc-800" />

          {user ? (
            <>
              <NavLink to="/profile" className={mobileLinkClass} onClick={() => setOpen(false)}>
                Mi cuenta ({displayName})
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-300 transition-colors hover:bg-zinc-900 hover:text-purple-500"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={mobileLinkClass} onClick={() => setOpen(false)}>
                Iniciar sesión
              </NavLink>
              <NavLink to="/register" className={mobileLinkClass} onClick={() => setOpen(false)}>
                Registrarse
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  )
}