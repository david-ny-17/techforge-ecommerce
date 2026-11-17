import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import Badge from "@/components/admin/Badge"
import Modal from "@/components/admin/Modal"
import { BTN_GHOST } from "@/lib/admin-styles"
import { formatDateTime, ORDER_STATUS } from "@/lib/admin-format"
import { formatPrice } from "@/lib/format"
import type { AdminOrder } from "@/types"

function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</p>
      <div className="space-y-0.5 text-sm text-zinc-200">{children}</div>
    </div>
  )
}

export default function OrderDetailModal({
  order,
  onClose,
}: {
  order: AdminOrder
  onClose: () => void
}) {
  const status = ORDER_STATUS[order.status]

  return (
    <Modal
      title={`Pedido #${order.id}`}
      onClose={onClose}
      wide
      footer={
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className={BTN_GHOST}>
            Cerrar
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={status.tone}>{status.label}</Badge>
            <span className="text-sm text-zinc-400">{formatDateTime(order.created_at)}</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">{status.hint}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoBlock title="Cliente">
            <p className="font-medium">{order.customer.name}</p>
            <p className="break-all text-zinc-400">{order.customer.email}</p>
            <p className="text-zinc-500">@{order.customer.username}</p>
          </InfoBlock>
          <InfoBlock title="Envío">
            <p>{order.shipping_address || "Sin dirección registrada"}</p>
            <p className="text-zinc-400">{order.shipping_city}</p>
          </InfoBlock>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[460px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 text-right font-medium">Cant.</th>
                <th className="px-4 py-3 text-right font-medium">Precio</th>
                <th className="px-4 py-3 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <Link
                      to={`/product/${item.product_slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium transition-colors hover:text-purple-300"
                    >
                      {item.product_name}
                    </Link>
                    <p className="text-xs text-zinc-500">{item.category}</p>
                  </td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-300">
                    {formatPrice(item.unit_price)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                    {formatPrice(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-end justify-between gap-4">
          <p className="text-xs text-zinc-500">
            Los precios son los del momento de la compra, no los actuales.
          </p>
          <p className="text-right">
            <span className="mr-3 text-sm text-zinc-400">Total</span>
            <span className="text-metal text-2xl font-bold">{formatPrice(order.total)}</span>
          </p>
        </div>
      </div>
    </Modal>
  )
}