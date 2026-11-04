import { Loader2 } from "lucide-react"
import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Link, Navigate } from "react-router-dom"

import FormField from "@/components/FormField"
import { useAuth } from "@/context/useAuth"
import { parseApiError } from "@/lib/errors"
import type { RegisterData } from "@/types"

const initialForm: RegisterData = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  password2: "",
}

export default function Register() {
  const { user, loading, register } = useAuth()

  const [form, setForm] = useState<RegisterData>(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/" replace />

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (form.password !== form.password2) {
      setError("Revisa los datos ingresados.")
      setFieldErrors({ password2: "Las contraseñas no coinciden." })
      return
    }

    setSubmitting(true)
    try {
      await register({
        ...form,
        username: form.username.trim(),
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      })
      // Al terminar hay sesión iniciada y esta página redirige sola a "/"
    } catch (err) {
      const info = parseApiError(err)
      setError(info.message)
      setFieldErrors(info.fields)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-10">
      <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-8 shadow-[0_0_40px_rgb(139_47_232/0.08)]">
        <h1 className="text-center text-3xl font-bold">
          Crear <span className="text-metal">Cuenta</span>
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Únete a TechForge y arma tu setup ideal
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

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
            label="Usuario"
            name="username"
            autoComplete="username"
            value={form.username}
            onChange={handleChange}
            error={fieldErrors.username}
            required
          />

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

          <FormField
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="new-password"
            hint="Mínimo 8 caracteres, no solo números ni demasiado común."
            value={form.password}
            onChange={handleChange}
            error={fieldErrors.password}
            required
          />

          <FormField
            label="Confirmar contraseña"
            name="password2"
            type="password"
            autoComplete="new-password"
            value={form.password2}
            onChange={handleChange}
            error={fieldErrors.password2}
            required
          />

          <button
            type="submit"
            disabled={
              submitting ||
              !form.username ||
              !form.email ||
              !form.password ||
              !form.password2
            }
            className="bg-metal glow-purple flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale"
          >
            {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {submitting ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          ¿Ya tienes cuenta?{" "}
          <Link
            to="/login"
            className="font-medium text-purple-500 transition-colors hover:text-purple-400"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </section>
  )
}