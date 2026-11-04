import { Eye, EyeOff } from "lucide-react"
import { useId, useState } from "react"
import type { InputHTMLAttributes } from "react"

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export default function FormField({
  label,
  error,
  hint,
  type = "text",
  ...props
}: FormFieldProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const isPassword = type === "password"

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={isPassword && visible ? "text" : type}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-md border bg-black px-3 py-2.5 text-gray-100 outline-none transition-colors placeholder:text-zinc-600 focus:ring-1 ${
            error
              ? "border-red-700 focus:border-red-500 focus:ring-red-500"
              : "border-zinc-700 focus:border-purple-500 focus:ring-purple-500"
          } ${isPassword ? "pr-10" : ""}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500 transition-colors hover:text-purple-500"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>
      )}
    </div>
  )
}