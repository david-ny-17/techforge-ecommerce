import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  page: number
  count: number
  pageSize: number
  onChange: (page: number) => void
}

export default function Pagination({ page, count, pageSize, onChange }: PaginationProps) {
  if (count === 0) return null

  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, count)

  const buttonClass =
    "rounded-lg border border-white/10 bg-white/[0.04] p-2 text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-purple-200 disabled:cursor-not-allowed disabled:opacity-40"

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-sm text-zinc-400 sm:flex-row">
      <span>
        {from}–{to} de {count}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className={buttonClass}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          aria-label="Página siguiente"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className={buttonClass}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}