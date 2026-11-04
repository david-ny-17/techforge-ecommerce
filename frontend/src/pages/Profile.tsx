import { useAuth } from "@/context/useAuth"

export default function Profile() {
  const { user } = useAuth()
  if (!user) return null

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

      <dl className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
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
    </section>
  )
}