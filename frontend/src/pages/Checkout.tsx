import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import type {
  Stripe,
  StripeCardElementChangeEvent,
  StripeCardElementOptions,
  StripeElementsOptions,
} from "@stripe/stripe-js"
import { CreditCard, ImageOff, Loader2, Lock, MapPin } from "lucide-react"
import { useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"

import CartNotice from "@/components/CartNotice"
import CouponBox from "@/components/CouponBox"
import FormField from "@/components/FormField"
import { DiscountBadge } from "@/components/PriceTag"
import { useAuth } from "@/context/useAuth"
import { useCart } from "@/context/useCart"
import { parseCheckoutError } from "@/lib/errors"
import { formatPrice } from "@/lib/format"
import { confirmPayment, createPaymentIntent } from "@/services/api"
import type { Order } from "@/types"

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined

// Stripe.js se descarga solo cuando se abre esta página (no en todo el sitio)
let stripePromise: Promise<Stripe | null> | null = null
function getStripe() {
  if (!PUBLISHABLE_KEY) return null
  stripePromise ??= loadStripe(PUBLISHABLE_KEY)
  return stripePromise
}

const ELEMENTS_OPTIONS: StripeElementsOptions = { locale: "es" }

// Estilo oscuro con acentos morados para el campo de tarjeta de Stripe
const CARD_OPTIONS: StripeCardElementOptions = {
  style: {
    base: {
      color: "#f3f4f6",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      fontSize: "16px",
      fontSmoothing: "antialiased",
      iconColor: "#a966ff",
      "::placeholder": { color: "#71717a" },
    },
    invalid: { color: "#fca5a5", iconColor: "#fca5a5" },
  },
}

const PAYMENT_STEPS = [
  "Creando tu pedido...",
  "Procesando el pago con Stripe...",
  "Confirmando tu orden...",
]

interface ShippingForm {
  address: string
  city: string
}

type FormErrors = Partial<Record<keyof ShippingForm, string>>

// Pedido y PaymentIntent ya creados: si el pago falla, se reutilizan al reintentar
interface PaymentSession {
  orderId: number
  clientSecret: string
  signature: string
}

function validate(form: ShippingForm): FormErrors {
  const errors: FormErrors = {}
  if (form.address.trim().length < 5) errors.address = "Ingresa una dirección válida."
  if (form.city.trim().length < 2) errors.city = "Ingresa tu ciudad."
  return errors
}

function CheckoutContent() {
  const { user } = useAuth()
  const {
    cart,
    totalItems,
    clearCart,
    getCartTotal,
    getCartSavings,
    syncCart,
    coupon,
    getCouponDiscount,
    getPayableTotal,
  } = useCart()
  const navigate = useNavigate()
  const stripe = useStripe()
  const elements = useElements()

  const [form, setForm] = useState<ShippingForm>({
    address: user?.address ?? "",
    city: user?.city ?? "",
  })
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [cardComplete, setCardComplete] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)
  const [cardFocused, setCardFocused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Evita el rebote a /cart cuando el carrito se vacía tras pagar
  const [completed, setCompleted] = useState(false)
  const [step, setStep] = useState(0)
  const sessionRef = useRef<PaymentSession | null>(null)

  if (cart.length === 0 && !completed) {
    return <Navigate to="/cart" replace />
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const field = e.target.name as keyof ShippingForm
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleCardChange = (event: StripeCardElementChangeEvent) => {
    setCardComplete(event.complete)
    setCardError(event.error?.message ?? null)
  }

  const finishPayment = (order: Order) => {
    // Pago aprobado: se vacía el carrito y se muestra la pantalla de éxito
    setCompleted(true)
    clearCart()
    navigate("/order-success", { replace: true, state: { order } })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError(null)

    const errors = validate(form)
    setFieldErrors(errors)

    const card = elements?.getElement(CardElement)
    if (!stripe || !elements || !card) {
      setError("El módulo de pago aún se está cargando. Espera un momento e inténtalo de nuevo.")
      return
    }
    if (!cardComplete) setCardError("Completa los datos de tu tarjeta.")
    if (Object.keys(errors).length > 0 || !cardComplete) return

    const address = form.address.trim()
    const city = form.city.trim()
    const signature = JSON.stringify({
      cart: cart.map((item) => [item.id, item.quantity, item.price]),
      coupon: coupon?.code ?? null,
      address,
      city,
    })
    const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : ""

    setSubmitting(true)
    setStep(0)
    try {

      // 0) Antes de cobrar se confirma que los precios, ofertas y stock que ve el cliente
      // siguen vigentes. Si algo cambió, NO se cobra: el aviso explica qué pasó.
      const sync = await syncCart()

      if (sync.couponRemoved) {
        setError(
          `El cupón ${sync.couponRemoved} ya no es válido y lo quitamos de tu pedido. ` +
            "Revisa el nuevo total y vuelve a pulsar «Pagar». No se ha hecho ningún cobro."
        )
        setSubmitting(false)
        return
      }

      if (sync.priceChanged || sync.removed.length > 0 || sync.adjusted.length > 0) {
        setError(
          "Los precios o la disponibilidad de tu pedido cambiaron. Revisa el nuevo total y " +
            "vuelve a pulsar «Pagar». No se ha hecho ningún cobro."
        )
        setSubmitting(false)
        return
      }

      // 1) Pedido + PaymentIntent (el total lo calcula el servidor desde la base de datos)
      let session = sessionRef.current
      if (!session || session.signature !== signature) {
        const created = await createPaymentIntent({
          cart_items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
          shipping_address: address,
          shipping_city: city,
          coupon_code: coupon?.code,
        })
        session = {
          orderId: created.order_id,
          clientSecret: created.client_secret,
          signature,
        }
        sessionRef.current = session
      }

      // 2) Los datos de la tarjeta viajan directo a Stripe, nunca a nuestro servidor
      setStep(1)
      const { error: stripeError } = await stripe.confirmCardPayment(session.clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: fullName || undefined,
            email: user?.email || undefined,
          },
        },
      })

      if (stripeError) {
        // El servidor registra el rechazo (el pedido queda como Fallido). Si el pago ya
        // estaba completo (p. ej. un reintento tras un corte de red), lo recupera aquí.
        const recovered = await confirmPayment(session.orderId).catch(() => null)
        if (recovered?.order.status === "PAID") {
          finishPayment(recovered.order)
          return
        }
        setError(stripeError.message ?? "No se pudo procesar el pago.")
        setSubmitting(false)
        return
      }

      // 3) El servidor verifica con Stripe que el pago esté completo (no se confía en el navegador)
      setStep(2)
      const result = await confirmPayment(session.orderId)
      if (result.order.status !== "PAID") {
        setError(result.detail)
        setSubmitting(false)
        return
      }

      finishPayment(result.order)
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

      <CartNotice className="mb-6" />

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
                Pago seguro con Stripe
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
                <strong className="font-semibold">Modo de pruebas (Stripe).</strong> Usa la
                tarjeta <span className="font-mono">4242 4242 4242 4242</span>, una fecha futura
                (por ejemplo <span className="font-mono">12/34</span>), cualquier CVC de 3
                dígitos y cualquier código postal (por ejemplo{" "}
                <span className="font-mono">12345</span>).
              </div>

              <p className="mb-1.5 text-sm font-medium text-zinc-300">Datos de la tarjeta</p>
              <div
                className={`rounded-lg border bg-black px-3 py-3.5 transition-colors ${
                  cardFocused
                    ? "border-purple-600 ring-1 ring-purple-600"
                    : cardError
                      ? "border-red-700"
                      : "border-zinc-800"
                }`}
              >
                <CardElement
                  options={CARD_OPTIONS}
                  onChange={handleCardChange}
                  onFocus={() => setCardFocused(true)}
                  onBlur={() => setCardFocused(false)}
                />
              </div>
              {cardError && <p className="mt-1.5 text-sm text-red-300">{cardError}</p>}
            </div>

            {/* Error del servidor o de Stripe (pago rechazado, stock, etc.) */}
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
              disabled={submitting || !stripe}
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
                  Pagar {formatPrice(getPayableTotal())}
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
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                    <span>
                      {item.quantity} × {formatPrice(item.price)}
                    </span>
                    {(item.discount_percent ?? 0) > 0 && item.original_price && (
                      <>
                        <span className="line-through">{formatPrice(item.original_price)}</span>
                        <DiscountBadge percent={item.discount_percent ?? 0} />
                      </>
                    )}
                  </p>
                </div>

                <p className="text-sm font-semibold text-gray-100">
                  {formatPrice(Number(item.price) * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
          
          <fieldset disabled={submitting} className="mt-4 min-w-0">
            <CouponBox />
          </fieldset>

          <div className="my-4 border-t border-zinc-800" />

          {getCartSavings() > 0 && (
            <dl className="mb-3 space-y-2 text-sm">
              <div className="flex justify-between text-zinc-400">
                <dt>Subtotal</dt>
                <dd className="text-gray-100">
                  {formatPrice(getCartTotal() + getCartSavings())}
                </dd>
              </div>
              <div className="flex justify-between text-purple-300">
                <dt>Descuentos</dt>
                <dd>-{formatPrice(getCartSavings())}</dd>
              </div>
            </dl>
          )}
          
          {coupon && (
            <dl className="mb-3 space-y-2 text-sm">
              <div className="flex justify-between text-purple-300">
                <dt>Cupón ({coupon.code})</dt>
                <dd>-{formatPrice(getCouponDiscount())}</dd>
              </div>
            </dl>
          )}

          <div className="flex items-end justify-between">
            <span className="text-zinc-400">Total a pagar</span>
            <span className="text-metal text-3xl font-bold">{formatPrice(getPayableTotal())}</span>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default function Checkout() {
  const stripe = getStripe()

  if (!stripe) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16">
        <div
          role="alert"
          className="rounded-lg border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300"
        >
          Falta configurar la clave pública de Stripe. Agrega{" "}
          <span className="font-mono">VITE_STRIPE_PUBLISHABLE_KEY</span> en{" "}
          <span className="font-mono">frontend\.env</span> y reinicia{" "}
          <span className="font-mono">npm run dev</span>.
        </div>
      </section>
    )
  }

  return (
    <Elements stripe={stripe} options={ELEMENTS_OPTIONS}>
      <CheckoutContent />
    </Elements>
  )
}