import { Loader2 } from "lucide-react"
import { useState } from "react"
import type { FormEvent } from "react"
import { Link, Navigate, useLocation } from "react-router-dom"

import FormField from "@/components/FormField"
import { useAuth } from "@/context/useAuth"
import { parseApiError } from "@/lib/errors"

export default function Login() {
  const { user, loading, login } = useAuth()
  const location = useLocation()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Si venía de una ruta protegida, vuelve allí; si no, al inicio
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/"

  // Si ya hay sesión (o se acaba de iniciar), redirige
  if (!loading && user) return <Navigate to={from} replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(username.trim(), password)
    } catch (err) {
      setError(parseApiError(err).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-8 shadow-[0_0_40px_rgb(139_47_232/0.08)]">
        <h1 className="text-center text-3xl font-bold">
          Iniciar <span className="text-metal">Sesión</span>
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Accede a tu cuenta de TechForge
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

          <FormField
            label="Usuario"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <FormField
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={submitting || !username || !password}
            className="bg-metal glow-purple flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale"
          >
            {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {submitting ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          ¿No tienes cuenta?{" "}
          <Link
            to="/register"
            className="font-medium text-purple-500 transition-colors hover:text-purple-400"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </section>
  )
}