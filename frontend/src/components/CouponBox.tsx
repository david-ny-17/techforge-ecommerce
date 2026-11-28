import { Loader2, Ticket, X } from "lucide-react"
import { useState } from "react"
import type { ChangeEvent, KeyboardEvent } from "react"

import { useCart } from "@/context/useCart"

interface CouponBoxProps {
  className?: string
}

export default function CouponBox({ className = "" }: CouponBoxProps) {
  const { coupon, applyCoupon, removeCoupon } = useCart()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleApply = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    const result = await applyCoupon(code)
    setLoading(false)
    if (result.ok) setCode("")
    else setError(result.message)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.toUpperCase())
    setError(null)
  }

  // Enter aplica el cupón sin enviar ningún formulario (en el checkout evita disparar el pago)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return
    e.preventDefault()
    void handleApply()
  }

  // Cupón ya aplicado: se muestra el código, su etiqueta y un botón para quitarlo
  if (coupon) {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-lg border border-purple-700/50 bg-purple-900/10 px-4 py-3 ${className}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Ticket className="h-5 w-5 shrink-0 text-purple-400" />
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-100">
              <span className="font-mono tracking-wider">{coupon.code}</span>
              <span className="rounded-full border border-purple-600 bg-purple-900/30 px-2 py-0.5 text-xs text-purple-300">
                {coupon.label}
              </span>
            </p>
            {coupon.description && (
              <p className="mt-0.5 truncate text-xs text-zinc-500">{coupon.description}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={removeCoupon}
          aria-label={`Quitar cupón ${coupon.code}`}
          className="shrink-0 rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // Sin cupón: campo de texto y botón Aplicar
  return (
    <div className={className}>
      <label htmlFor="coupon-code" className="mb-1.5 block text-sm font-medium text-zinc-300">
        ¿Tienes un cupón?
      </label>
      <div className="flex gap-2">
        <input
          id="coupon-code"
          type="text"
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={loading}
          maxLength={30}
          autoComplete="off"
          spellCheck={false}
          placeholder="Escribe tu código"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "coupon-error" : undefined}
          className={`min-w-0 flex-1 rounded-lg border bg-black px-3 py-2.5 font-mono text-sm uppercase tracking-wider text-gray-100 placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-600 focus:outline-none focus:ring-1 disabled:opacity-60 ${
            error
              ? "border-red-700 focus:border-red-600 focus:ring-red-600"
              : "border-zinc-800 focus:border-purple-600 focus:ring-purple-600"
          }`}
        />
        <button
          type="button"
          onClick={() => void handleApply()}
          disabled={loading || code.trim() === ""}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple-600 bg-black px-4 py-2.5 text-sm font-semibold text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600 disabled:hover:bg-black"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
        </button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="mt-1.5 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}