import { Link } from "react-router-dom"

import GlassCard from "@/components/admin/GlassCard"

export default function AdminSoon({ title }: { title: string }) {
  return (
    <GlassCard className="mx-auto mt-10 max-w-xl p-10 text-center">
      <h1 className="text-2xl font-bold">
        <span className="text-metal">{title}</span>
      </h1>
      <p className="mt-3 text-sm text-zinc-400">
        Esta sección llega en la siguiente entrega del panel.
      </p>
      <Link
        to="/admin"
        className="bg-metal glow-purple mt-6 inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
      >
        Volver al dashboard
      </Link>
    </GlassCard>
  )
}