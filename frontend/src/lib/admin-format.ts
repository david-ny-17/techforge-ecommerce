import type { OrderStatus } from "@/types"

export const ORDER_STATUS: Record<
  OrderStatus,
  { label: string; tone: "success" | "warning" | "danger"; hint: string }
> = {
  PAID: {
    label: "Pagado",
    tone: "success",
    hint: "El pago fue verificado y el stock ya se descontó.",
  },
  PENDING: {
    label: "Pendiente",
    tone: "warning",
    hint: "El cliente aún no completó el pago (o abandonó la compra).",
  },
  FAILED: {
    label: "Fallido",
    tone: "danger",
    hint: "El pago fue rechazado, o el producto se agotó mientras pagaba (en ese caso se reembolsa solo).",
  },
}

// Un elemento se marca como "Nuevo" durante 90 s desde que se creó
export const FRESH_MS = 90_000

// `now` = hora de la última consulta en milisegundos (0 si aún no hay datos)
export function isFresh(iso: string, now: number): boolean {
  return now > 0 && now - Date.parse(iso) < FRESH_MS
}

export function timeAgo(iso: string, now: number): string {
  if (now <= 0) return ""
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000))
  if (seconds < 45) return "ahora"
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  return `hace ${Math.round(hours / 24)} d`
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })