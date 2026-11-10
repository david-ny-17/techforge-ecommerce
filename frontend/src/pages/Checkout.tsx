import { CreditCard, ImageOff, Loader2, Lock, MapPin } from "lucide-react"
import { useEffect, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"

import FormField from "@/components/FormField"
import { useAuth } from "@/context/useAuth"
import { useCart } from "@/context/useCart"
import { parseCheckoutError } from "@/lib/errors"
import { formatPrice } from "@/lib/format"
import { processCheckout } from "@/services/api"

interface CheckoutForm {
  address: string
  city: string
  cardNumber: string
  expiry: string
  cvv: string
}

type FormErrors = Partial<Record<keyof CheckoutForm, string>>

// "4242424242424242" -> "4242 4242 4242 4242"
const formatCardNumber = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")

// "1228" -> "12/28"
const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

function validate(form: CheckoutForm): FormErrors {
  const errors: FormErrors = {}

  if (form.address.trim().length < 5) errors.address = "Ingresa una dirección válida."
  if (form.city.trim().length < 2) errors.city = "Ingresa tu ciudad."

  if (form.cardNumber.replace(/\D/g, "").length !== 16) {
    errors.cardNumber = "El número de tarjeta debe tener 16 dígitos."
  }

  const match = /^(\d{2})\/(\d{2})$/.exec(form.expiry)
  if (!match) {
    errors.expiry = "Usa el formato MM/AA."
  } else {
    const month = Number(match[1])
    const year = 2000 + Number(match[2])
    if (month < 1 || month > 12) {
      errors.expiry = "Mes inválido."
    } else if (new Date(year, month, 1) <= new Date()) {
      // new Date(year, month, 1) = primer día del mes siguiente al de vencimiento
      errors.expiry = "La tarjeta está vencida."
    }
  }

  if (!/^\d{3,4}$/.test(form.cvv)) errors.cvv = "El CVV debe tener 3 o 4 dígitos."

  return errors
}

const PAYMENT_STEPS = [
  "Encriptando transacción...",
  "Verificando fondos...",
  "Autorizando con la entidad bancaria...",
  "Generando tu orden...",
]

export default function Checkout() {
  const { user } = useAuth()
  const { cart, totalItems, clearCart, getCartTotal } = useCart()
  const navigate = useNavigate()

  const [form, setForm] = useState<CheckoutForm>({
    address: user?.address ?? "",
    city: user?.city ?? "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  })
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Evita el rebote a /cart cuando el carrito se vacía tras pagar
  const [completed, setCompleted] = useState(false)
  const [step, setStep] = useState(0)

// Avanza los mensajes mientras se procesa el pago y se detiene en el último
  useEffect(() => {
    if (!submitting) return
    const timer = window.setInterval(() => {
      setStep((prev) => Math.min(prev + 1, PAYMENT_STEPS.length - 1))
    }, 700)
    return () => window.clearInterval(timer)
  }, [submitting])

  if (cart.length === 0 && !completed) {
    return <Navigate to="/cart" replace />
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const field = e.target.name as keyof CheckoutForm
    let value = e.target.value

    if (field === "cardNumber") value = formatCardNumber(value)
    if (field === "expiry") value = formatExpiry(value)
    if (field === "cvv") value = value.replace(/\D/g, "").slice(0, 4)

    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return

    setError(null)
    const errors = validate(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
       const result = await processCheckout({
        cart_items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        payment_info: { card_number: form.cardNumber.replace(/\D/g, "") },
        shipping_address: form.address.trim(),
        shipping_city: form.city.trim(),
      })

      // Pago aprobado: se vacía el carrito y se muestra la pantalla de éxito
      setCompleted(true)
      clearCart()
      navigate("/order-success", {
        replace: true,
        state: { order: result.order },
      })
    } catch (err) {
      // Pago rechazado u otro error: el carrito se conserva para reintentar
      setError(parseCheckoutError(err))
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          Finalizar <span className="text-metal">Compra</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {totalItems} {totalItems === 1 ? "artículo" : "artículos"} en tu pedido
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Columna izquierda: formulario */}
        <form onSubmit={handleSubmit} noValidate className="relative lg:col-span-2">
          {submitting && (
            <div
              role="status"
              aria-live="polite"
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-xl bg-black/80 backdrop-blur-md"
            >
              <div className="relative h-16 w-16">
                <span className="absolute inset-0 animate-ping rounded-full bg-purple-600/30" />
                <span className="absolute inset-0 animate-spin rounded-full border-2 border-purple-900 border-t-purple-500" />
                <Lock className="absolute inset-0 m-auto h-6 w-6 text-purple-400" />
              </div>
              <p className="font-mono text-xs uppercase tracking-widest text-purple-500">
                Pasarela segura
              </p>
              <p className="font-medium text-gray-100">{PAYMENT_STEPS[step]}</p>
              <div className="h-1 w-56 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-purple-600 transition-all duration-500"
                  style={{ width: `${((step + 1) / PAYMENT_STEPS.length) * 100}%` }}
                />
              </div>
              <p className="text-sm text-zinc-500">No cierres ni recargues esta página.</p>
            </div>
          )}

          <fieldset disabled={submitting} className="space-y-6">
            {/* Datos de envío */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
              <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-purple-500">
                <MapPin className="h-4 w-4" />
                Datos de envío
              </h2>

              <div className="space-y-5">
                <FormField
                  label="Dirección"
                  name="address"
                  autoComplete="street-address"
                  placeholder="Calle, número, referencia"
                  value={form.address}
                  onChange={handleChange}
                  error={fieldErrors.address}
                />
                <FormField
                  label="Ciudad"
                  name="city"
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={handleChange}
                  error={fieldErrors.city}
                />
              </div>
            </div>

            {/* Método de pago */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
              <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-purple-500">
                <CreditCard className="h-4 w-4" />
                Método de pago
              </h2>

              <div className="mb-5 rounded-lg border border-purple-700/50 bg-purple-900/10 p-3 text-xs leading-relaxed text-purple-300">
                <strong className="font-semibold">Modo de pruebas.</strong> Usa la tarjeta{" "}
                <span className="font-mono">4242 4242 4242 4242</span> para aprobar el pago.
                Cualquier otro número será rechazado. Fecha futura y CVV de 3 dígitos.
              </div>

              <div className="space-y-5">
                <FormField
                  label="Número de tarjeta"
                  name="cardNumber"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="0000 0000 0000 0000"
                  value={form.cardNumber}
                  onChange={handleChange}
                  error={fieldErrors.cardNumber}
                />

                <div className="grid grid-cols-2 gap-5">
                  <FormField
                    label="Vencimiento"
                    name="expiry"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/AA"
                    value={form.expiry}
                    onChange={handleChange}
                    error={fieldErrors.expiry}
                  />
                  <FormField
                    label="CVV"
                    name="cvv"
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    value={form.cvv}
                    onChange={handleChange}
                    error={fieldErrors.cvv}
                  />
                </div>
              </div>
            </div>

            {/* Error del servidor (pago rechazado, stock, etc.) */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="bg-metal glow-purple flex w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando pago...
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  Pagar {formatPrice(getCartTotal())}
                </>
              )}
            </button>
          </fieldset>
        </form>

        {/* Columna derecha: resumen */}
        <aside className="h-fit rounded-xl border border-zinc-800 bg-zinc-950 p-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-purple-500">
              Resumen del pedido
            </h2>
            <Link
              to="/cart"
              className="text-xs text-zinc-500 transition-colors hover:text-purple-500"
            >
              Editar carrito
            </Link>
          </div>

          <ul className="mt-4 divide-y divide-zinc-800">
            {cart.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-900">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <ImageOff className="h-5 w-5 text-zinc-700" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-gray-100">{item.name}</p>
                  <p className="text-xs text-zinc-500">
                    {item.quantity} × {formatPrice(item.price)}
                  </p>
                </div>

                <p className="text-sm font-semibold text-gray-100">
                  {formatPrice(Number(item.price) * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="my-4 border-t border-zinc-800" />

          <div className="flex items-end justify-between">
            <span className="text-zinc-400">Total a pagar</span>
            <span className="text-metal text-3xl font-bold">{formatPrice(getCartTotal())}</span>
          </div>
        </aside>
      </div>
    </section>
  )
}