import { Bookmark, Check, KeyRound, LayoutDashboard, Loader2, Package, Pencil } from "lucide-react"
import { useEffect, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Link } from "react-router-dom"

import ChangePasswordForm from "@/components/ChangePasswordForm"
import FormField from "@/components/FormField"
import { useAuth } from "@/context/useAuth"
import { parseApiError } from "@/lib/errors"
import { updateProfile } from "@/services/account-api"
import type { ProfileUpdate, User } from "@/types"

const toForm = (user: User): ProfileUpdate => ({
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  phone: user.phone,
  address: user.address,
  city: user.city,
})

const linkClass =
  "inline-flex items-center gap-2 rounded-lg border border-purple-600 bg-black px-5 py-2.5 font-semibold text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300"

function ProfileContent({ user }: { user: User }) {
  const { updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [form, setForm] = useState<ProfileUpdate>(() => toForm(user))
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // El aviso de "guardado" se oculta solo
  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(null), 4000)
    return () => window.clearTimeout(id)
  }, [notice])

  const startEditing = () => {
    setForm(toForm(user))
    setError(null)
    setFieldErrors({})
    setEditing(true)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    setError(null)
    setFieldErrors({})

    if (!form.email.trim()) {
      setError("Revisa los datos ingresados.")
      setFieldErrors({ email: "El correo es obligatorio." })
      return
    }

    setSaving(true)
    try {
      const updated = await updateProfile({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
      })
      updateUser(updated) // la barra de navegación y el checkout ven los datos nuevos al instante
      setEditing(false)
      setNotice("Datos actualizados.")
    } catch (err) {
      const info = parseApiError(err, "No se pudieron guardar los cambios. Inténtalo de nuevo.")
      setError(info.message)
      setFieldErrors(info.fields)
    } finally {
      setSaving(false)
    }
  }

  const rows: [string, string][] = [
    ["Usuario", user.username],
    ["Nombre", `${user.first_name} ${user.last_name}`.trim()],
    ["Correo", user.email],
    ["Teléfono", user.phone],
    ["Ciudad", user.city],
    ["Dirección", user.address],
  ]

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">
        Mi <span className="text-metal">Cuenta</span>
      </h1>

      {notice && (
        <div
          role="status"
          className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          <Check className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      {/* Datos personales */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="font-semibold">Datos personales</h2>
          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} noValidate className="space-y-5 p-5">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            <FormField
              label="Usuario"
              name="username"
              value={user.username}
              disabled
              hint="El usuario no se puede cambiar."
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                label="Nombre"
                name="first_name"
                autoComplete="given-name"
                value={form.first_name}
                onChange={handleChange}
                error={fieldErrors.first_name}
              />
              <FormField
                label="Apellido"
                name="last_name"
                autoComplete="family-name"
                value={form.last_name}
                onChange={handleChange}
                error={fieldErrors.last_name}
              />
            </div>

            <FormField
              label="Correo electrónico"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              error={fieldErrors.email}
              required
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                label="Teléfono"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={handleChange}
                error={fieldErrors.phone}
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

            <FormField
              label="Dirección"
              name="address"
              autoComplete="street-address"
              hint="Se usa para precargar tus datos de envío al comprar."
              value={form.address}
              onChange={handleChange}
              error={fieldErrors.address}
            />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="rounded-lg border border-zinc-700 bg-black px-6 py-3 font-semibold text-zinc-300 transition-colors hover:border-purple-600 hover:text-purple-300 disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-metal glow-purple flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale"
              >
                {saving && <Loader2 className="h-5 w-5 animate-spin" />}
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        ) : (
          <dl>
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-4 border-b border-zinc-800 px-5 py-4 last:border-b-0"
              >
                <dt className="text-sm font-medium text-zinc-400">{label}</dt>
                <dd className="text-right text-sm text-gray-100">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Seguridad */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="font-semibold">Seguridad</h2>
          {!changingPassword && (
            <button
              type="button"
              onClick={() => setChangingPassword(true)}
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-purple-400 transition-colors hover:bg-purple-900/20 hover:text-purple-300"
            >
              <KeyRound className="h-4 w-4" />
              Cambiar contraseña
            </button>
          )}
        </div>

        {changingPassword ? (
          <div className="p-5">
            <ChangePasswordForm
              onDone={() => {
                setChangingPassword(false)
                setNotice("Contraseña actualizada.")
              }}
              onCancel={() => setChangingPassword(false)}
            />
          </div>
        ) : (
          <p className="px-5 py-4 text-sm text-zinc-500">
            Te recomendamos usar una contraseña única que no uses en otros sitios.
          </p>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/orders" className={linkClass}>
          <Package className="h-5 w-5" />
          Ver mis pedidos
        </Link>
        <Link to="/builds" className={linkClass}>
          <Bookmark className="h-5 w-5" />
          Mis armados
        </Link>
        {user.is_staff && (
          <Link to="/admin" className={linkClass}>
            <LayoutDashboard className="h-5 w-5" />
            Panel de administración
          </Link>
        )}
      </div>
    </section>
  )
}

export default function Profile() {
  const { user } = useAuth()
  if (!user) return null
  return <ProfileContent user={user} />
}