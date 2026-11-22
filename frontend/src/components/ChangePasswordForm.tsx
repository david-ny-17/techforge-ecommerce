import { Loader2 } from "lucide-react"
import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"

import FormField from "@/components/FormField"
import { useAuth } from "@/context/useAuth"
import { parseApiError } from "@/lib/errors"
import { changePassword } from "@/services/account-api"

interface ChangePasswordFormProps {
  onDone: () => void
  onCancel?: () => void
}

const initialForm = { current_password: "", new_password: "", new_password2: "" }

export default function ChangePasswordForm({ onDone, onCancel }: ChangePasswordFormProps) {
  const { updateUser } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (form.new_password !== form.new_password2) {
      setError("Revisa los datos ingresados.")
      setFieldErrors({ new_password2: "Las contraseñas no coinciden." })
      return
    }

    setSubmitting(true)
    try {
      const response = await changePassword(form)
      // El servidor devuelve el usuario ya sin el cambio obligatorio pendiente
      updateUser(response.user)
      onDone()
    } catch (err) {
      const info = parseApiError(err, "No se pudo cambiar la contraseña. Inténtalo de nuevo.")
      setError(info.message)
      setFieldErrors(info.fields)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <FormField
        label="Contraseña actual"
        name="current_password"
        type="password"
        autoComplete="current-password"
        value={form.current_password}
        onChange={handleChange}
        error={fieldErrors.current_password}
        required
      />

      <FormField
        label="Contraseña nueva"
        name="new_password"
        type="password"
        autoComplete="new-password"
        hint="Mínimo 8 caracteres, no solo números ni demasiado común, y distinta de la actual."
        value={form.new_password}
        onChange={handleChange}
        error={fieldErrors.new_password}
        required
      />

      <FormField
        label="Confirmar contraseña nueva"
        name="new_password2"
        type="password"
        autoComplete="new-password"
        value={form.new_password2}
        onChange={handleChange}
        error={fieldErrors.new_password2}
        required
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-zinc-700 bg-black px-6 py-3 font-semibold text-zinc-300 transition-colors hover:border-purple-600 hover:text-purple-300 disabled:opacity-40"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={
            submitting || !form.current_password || !form.new_password || !form.new_password2
          }
          className="bg-metal glow-purple flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {submitting ? "Guardando..." : "Cambiar contraseña"}
        </button>
      </div>
    </form>
  )
}