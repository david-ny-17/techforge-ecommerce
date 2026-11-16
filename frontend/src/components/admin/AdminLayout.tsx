import { Cpu, LayoutDashboard, LogOut, Package, ShoppingBag, Store, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"

import GlassCard from "@/components/admin/GlassCard"
import { useAuth } from "@/context/useAuth"

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Productos", icon: Package },
  { to: "/admin/orders", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/customers", label: "Clientes", icon: Users },
]

const sideLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? "border-purple-500/30 bg-purple-500/15 text-purple-100 shadow-[0_0_20px_rgb(139_47_232/0.25)]"
      : "border-transparent text-zinc-400 hover:bg-white/5 hover:text-gray-100"
  }`

const pillLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "border-purple-500/40 bg-purple-500/20 text-purple-100"
      : "border-white/10 bg-white/[0.04] text-zinc-400"
  }`

function AdminBadge() {
  return (
    <span className="rounded-md border border-purple-500/40 bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-200">
      Admin
    </span>
  )
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() || user.username : ""
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

  const handleLogout = () => {
    navigate("/login")
    logout()
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black text-gray-100">
      {/* Resplandores de fondo: dan color al cristal desenfocado */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-purple-700/25 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[30rem] w-[30rem] rounded-full bg-fuchsia-700/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-purple-900/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-[1600px] gap-5 p-3 sm:p-5">
        {/* Barra lateral (escritorio) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <GlassCard className="sticky top-5 flex h-[calc(100vh-2.5rem)] flex-col p-4">
            <Link to="/admin" className="flex items-center gap-2 px-2 py-1">
              <Cpu className="h-6 w-6 text-purple-400" />
              <span className="text-xl font-bold tracking-tight">
                Tech<span className="text-metal">Forge</span>
              </span>
              <AdminBadge />
            </Link>

            <nav aria-label="Secciones del panel" className="mt-8 space-y-1.5">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={sideLinkClass}>
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-sm font-semibold text-purple-200">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{fullName}</p>
                  <p className="truncate text-xs text-zinc-500">{user?.email}</p>
                </div>
              </div>

              <Link
                to="/"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-gray-100"
              >
                <Store className="h-5 w-5 shrink-0" />
                Ir a la tienda
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-gray-100"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                Cerrar sesión
              </button>
            </div>
          </GlassCard>
        </aside>

        <div className="min-w-0 flex-1 space-y-5">
          {/* Cabecera y navegación (móvil y tablet) */}
          <div className="space-y-3 lg:hidden">
            <GlassCard className="flex items-center justify-between px-4 py-3">
              <Link to="/admin" className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-purple-400" />
                <span className="font-bold tracking-tight">
                  Tech<span className="text-metal">Forge</span>
                </span>
                <AdminBadge />
              </Link>
              <div className="flex items-center gap-1">
                <Link
                  to="/"
                  aria-label="Ir a la tienda"
                  title="Ir a la tienda"
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-gray-100"
                >
                  <Store className="h-5 w-5" />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-gray-100"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </GlassCard>

            <nav aria-label="Secciones del panel" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={pillLinkClass}>
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}