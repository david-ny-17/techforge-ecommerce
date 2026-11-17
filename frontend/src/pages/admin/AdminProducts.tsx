import { Check, Loader2, Package, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import Badge from "@/components/admin/Badge"
import ConfirmModal from "@/components/admin/ConfirmModal"
import GlassCard from "@/components/admin/GlassCard"
import Pagination from "@/components/admin/Pagination"
import ProductFormModal from "@/components/admin/ProductFormModal"
import { BTN_GHOST, BTN_PRIMARY, INPUT_CLASS, SELECT_CLASS } from "@/lib/admin-styles"
import { parseApiError } from "@/lib/errors"
import { formatPrice } from "@/lib/format"
import { useDebouncedValue } from "@/lib/use-debounce"
import { usePolling } from "@/lib/use-polling"
import { deleteAdminProduct, getAdminProducts } from "@/services/admin-api"
import { getCategories } from "@/services/api"
import type { AdminProduct, Category } from "@/types"

const PAGE_SIZE = 12 // igual que el backend (AdminPagination)
const POLL_MS = 10_000
const LOW_STOCK = 5

const ORDERINGS = [
  { value: "-created_at", label: "Más recientes" },
  { value: "name", label: "Nombre (A-Z)" },
  { value: "price", label: "Precio: menor a mayor" },
  { value: "-price", label: "Precio: mayor a menor" },
  { value: "stock", label: "Stock: menor a mayor" },
  { value: "-units_sold", label: "Más vendidos" },
]

export default function AdminProducts() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState("")
  const [lowStock, setLowStock] = useState(false)
  const [ordering, setOrdering] = useState("-created_at")
  const [page, setPage] = useState(1)

  const [categories, setCategories] = useState<Category[]>([])
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null)
  const [deleting, setDeleting] = useState<AdminProduct | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const query = {
    page,
    search: debouncedSearch,
    category,
    is_active: status,
    stock_lte: lowStock ? String(LOW_STOCK) : "",
    ordering,
  }
  const { data, error, loading, refresh } = usePolling(
    () => getAdminProducts(query),
    POLL_MS,
    JSON.stringify(query)
  )

  // Las categorías se cargan una sola vez (para el filtro y el formulario)
  useEffect(() => {
    let cancelled = false
    getCategories()
      .then((result) => {
        if (!cancelled) setCategories(result)
      })
      .catch(() => {
        // Sin categorías el filtro queda vacío; la tabla sigue funcionando
      })
    return () => {
      cancelled = true
    }
  }, [])

  // El aviso de "guardado" se oculta solo
  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(null), 4000)
    return () => window.clearTimeout(id)
  }, [notice])

  const handleSaved = (message: string) => {
    setEditing(null)
    setNotice(message)
    refresh()
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      const result = await deleteAdminProduct(deleting.id)
      // Si era el último de la página, se retrocede una
      if (data && data.results.length === 1 && page > 1) setPage(page - 1)
      setNotice(
        result.deactivated
          ? "El producto tiene pedidos, así que se desactivó en lugar de borrarse."
          : "Producto eliminado."
      )
      setDeleting(null)
      refresh()
    } catch (err) {
      setDeleteError(parseApiError(err, "No se pudo eliminar el producto.").message)
    } finally {
      setDeleteBusy(false)
    }
  }

  const rows = data?.results ?? []

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            <span className="text-metal">Productos</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {data ? `${data.count} productos` : "Cargando..."} · el stock y las ventas se actualizan
            solos.
          </p>
        </div>
        <button type="button" onClick={() => setEditing("new")} className={BTN_PRIMARY}>
          <Plus className="h-4 w-4" />
          Nuevo producto
        </button>
      </header>

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          <Check className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      {/* Filtros */}
      <GlassCard className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <div className="relative sm:col-span-2 xl:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            aria-label="Buscar productos"
            placeholder="Buscar por nombre o descripción..."
            className={`${INPUT_CLASS} pl-9`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <select
          aria-label="Filtrar por categoría"
          className={SELECT_CLASS}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Todas las categorías</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por estado"
          className={SELECT_CLASS}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Activos e inactivos</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
        </select>

        <select
          aria-label="Ordenar por"
          className={SELECT_CLASS}
          value={ordering}
          onChange={(e) => {
            setOrdering(e.target.value)
            setPage(1)
          }}
        >
          {ORDERINGS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => {
              setLowStock(e.target.checked)
              setPage(1)
            }}
            className="h-4 w-4 accent-purple-500"
          />
          Stock bajo (≤ {LOW_STOCK})
        </label>
      </GlassCard>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300"
        >
          <span>No se pudo cargar la lista. Se reintenta solo.</span>
          {page > 1 && (
            <button type="button" onClick={() => setPage(1)} className={BTN_GHOST}>
              Volver a la página 1
            </button>
          )}
        </div>
      )}

      {/* Tabla */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Vendidos</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && !data && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-purple-500" />
                  </td>
                </tr>
              )}

              {data && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    No hay productos con esos filtros.
                  </td>
                </tr>
              )}

              {rows.map((product) => {
                const thumb = product.image || product.image_url || null
                const lockedDelete = product.has_orders && !product.is_active
                return (
                  <tr key={product.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
                          {thumb ? (
                            <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-zinc-600" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="truncate font-medium">{product.name}</p>
                          <p className="truncate text-xs text-zinc-500">{product.category_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={product.stock === 0 ? "danger" : product.stock <= LOW_STOCK ? "warning" : "neutral"}
                      >
                        {product.stock === 0 ? "Agotado" : `${product.stock} u.`}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{product.units_sold}</td>
                    <td className="px-4 py-3">
                      <Badge tone={product.is_active ? "success" : "neutral"}>
                        {product.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Editar ${product.name}`}
                          title="Editar"
                          onClick={() => setEditing(product)}
                          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-purple-300"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar ${product.name}`}
                          title={lockedDelete ? "Ya está desactivado (tiene pedidos)" : "Eliminar"}
                          disabled={lockedDelete}
                          onClick={() => {
                            setDeleteError(null)
                            setDeleting(product)
                          }}
                          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <Pagination page={page} count={data?.count ?? 0} pageSize={PAGE_SIZE} onChange={setPage} />
      </GlassCard>

      {editing !== null && (
        <ProductFormModal
          key={editing === "new" ? "new" : editing.id}
          product={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {deleting && (
        <ConfirmModal
          danger
          title={deleting.has_orders ? "Desactivar producto" : "Eliminar producto"}
          message={
            deleting.has_orders
              ? `«${deleting.name}» ya tiene pedidos, así que no se puede borrar sin perder el historial de ventas. Se desactivará y dejará de aparecer en la tienda (podrás reactivarlo cuando quieras).`
              : `Se eliminará «${deleting.name}» y su imagen de forma permanente. Esta acción no se puede deshacer.`
          }
          confirmLabel={deleting.has_orders ? "Desactivar" : "Eliminar"}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}