// Clases compartidas por los formularios y botones del panel de administración
export const INPUT_CLASS =
  "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-gray-100 outline-none transition-colors [color-scheme:dark] placeholder:text-zinc-600 focus:border-purple-500"

export const SELECT_CLASS = `${INPUT_CLASS} [&>option]:bg-zinc-900 [&>option]:text-gray-100`

export const BTN_PRIMARY =
  "bg-metal glow-purple inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale"

export const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-purple-200 disabled:cursor-not-allowed disabled:opacity-40"

export const BTN_DANGER =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/15 px-5 py-2.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"