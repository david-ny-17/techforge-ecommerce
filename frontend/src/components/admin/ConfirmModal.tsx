import Modal from "@/components/admin/Modal"
import { BTN_DANGER, BTN_GHOST, BTN_PRIMARY } from "@/lib/admin-styles"

interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  busy?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger = false,
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal title={title} onClose={onCancel} busy={busy}>
      <p className="text-sm leading-relaxed text-zinc-300">{message}</p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onCancel} disabled={busy} className={BTN_GHOST}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={danger ? BTN_DANGER : BTN_PRIMARY}
        >
          {busy ? "Procesando..." : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}