import { Package, Plus, Trash2, Upload, X } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"

import Field from "@/components/admin/Field"
import Modal from "@/components/admin/Modal"
import { BTN_GHOST, BTN_PRIMARY, INPUT_CLASS, SELECT_CLASS } from "@/lib/admin-styles"
import { parseApiError } from "@/lib/errors"
import { createAdminProduct, updateAdminProduct } from "@/services/admin-api"
import type { AdminProduct, Category } from "@/types"

interface SpecRow {
  id: number
  key: string
  value: string
}

interface ProductFormModalProps {
  // null = producto nuevo
  product: AdminProduct | null
  categories: Category[]
  onClose: () => void
  onSaved: (message: string) => void
}

const MAX_IMAGE_MB = 5

// "true"/"false" -> booleano, "650" -> número, lo demás se queda como texto
function parseSpecValue(raw: string): string | number | boolean {
  const text = raw.trim()
  if (text === "true") return true
  if (text === "false") return false
  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(text)) return Number(text)
  return text
}

function toRows(specs: AdminProduct["specifications"] | undefined): SpecRow[] {
  return Object.entries(specs ?? {}).map(([key, value], index) => ({
    id: index,
    key,
    value: String(value),
  }))
}

export default function ProductFormModal({
  product,
  categories,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const isEdit = product !== null
  const uid = useId()
  const formId = `${uid}-form`
  const fileInputRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  const [name, setName] = useState(product?.name ?? "")
  const [categoryId, setCategoryId] = useState(product ? String(product.category) : "")
  const [price, setPrice] = useState(product?.price ?? "")
  const [stock, setStock] = useState(product ? String(product.stock) : "0")
  const [description, setDescription] = useState(product?.description ?? "")
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "")
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [specs, setSpecs] = useState<SpecRow[]>(() => toRows(product?.specifications))
  const nextSpecId = useRef(Object.keys(product?.specifications ?? {}).length)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Libera la vista previa temporal cuando cambia o se cierra el formulario
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const uploadedImage = removeImage ? null : (product?.image ?? null)
  const shownImage = previewUrl ?? uploadedImage ?? (imageUrl.trim() || null)
  const canRemoveImage = file !== null || uploadedImage !== null

  // Lleva la vista al aviso de error, que está arriba del formulario (dentro del área con scroll)
  const scrollToError = () => {
    window.requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    e.target.value = "" // permite elegir el mismo archivo otra vez
    if (!selected) return

    if (!selected.type.startsWith("image/")) {
      setFieldErrors((prev) => ({ ...prev, image: "El archivo debe ser una imagen." }))
      return
    }
    if (selected.size > MAX_IMAGE_MB * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        image: `La imagen no puede superar los ${MAX_IMAGE_MB} MB.`,
      }))
      return
    }
    clearFieldError("image")
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
    setRemoveImage(false)
  }

  const handleRemoveImage = () => {
    if (file) {
      // Cancela la imagen recién elegida
      setFile(null)
      setPreviewUrl(null)
    } else {
      // Quita la imagen ya guardada (se aplica al pulsar Guardar)
      setRemoveImage(true)
    }
  }

  const updateSpec = (id: number, field: "key" | "value", value: string) => {
    setSpecs((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
    clearFieldError("specifications")
  }

  const addSpec = () => {
    setSpecs((prev) => [...prev, { id: nextSpecId.current++, key: "", value: "" }])
  }

  const removeSpec = (id: number) => setSpecs((prev) => prev.filter((row) => row.id !== id))

  // Valida en el navegador; el servidor vuelve a validar todo igualmente
  const validate = (): {
    errors: Record<string, string>
    specifications: Record<string, string | number | boolean>
  } => {
    const errors: Record<string, string> = {}
    const specifications: Record<string, string | number | boolean> = {}

    if (name.trim().length < 2) errors.name = "El nombre debe tener al menos 2 caracteres."
    if (!categoryId) errors.category = "Elige una categoría."
    if (!(Number(price.replace(",", ".")) > 0)) errors.price = "Ingresa un precio mayor que cero."
    if (!/^\d+$/.test(stock.trim())) errors.stock = "El stock debe ser un número entero (0 o más)."

    for (const row of specs) {
      const key = row.key.trim()
      const value = row.value.trim()
      if (!key && !value) continue // fila vacía: se ignora
      if (!key) {
        errors.specifications = "Cada especificación necesita un nombre (por ejemplo: socket)."
        break
      }
      if (key in specifications) {
        errors.specifications = `La especificación «${key}» está repetida.`
        break
      }
      specifications[key] = parseSpecValue(value)
    }

    return { errors, specifications }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return

    const { errors, specifications } = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setError("Revisa los campos marcados.")
      scrollToError()
      return
    }

    const form = new FormData()
    form.append("name", name.trim())
    form.append("category", categoryId)
    form.append("price", Number(price.replace(",", ".")).toFixed(2))
    form.append("stock", stock.trim())
    form.append("description", description.trim())
    form.append("image_url", imageUrl.trim())
    form.append("is_active", isActive ? "true" : "false")
    form.append("specifications", JSON.stringify(specifications))
    if (file) form.append("image", file)
    else if (removeImage) form.append("remove_image", "true")

    setSaving(true)
    setError(null)
    try {
      if (product) await updateAdminProduct(product.id, form)
      else await createAdminProduct(form)
      onSaved(isEdit ? "Producto actualizado." : "Producto creado.")
    } catch (err) {
      const info = parseApiError(err, "No se pudo guardar el producto. Inténtalo de nuevo.")
      setError(info.message)
      setFieldErrors(info.fields)
      scrollToError()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? "Editar producto" : "Nuevo producto"}
      onClose={onClose}
      busy={saving}
      wide
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className={BTN_GHOST}>
            Cancelar
          </button>
          {/* El atributo form lo enlaza con el formulario aunque el botón esté fuera de él */}
          <button type="submit" form={formId} disabled={saving} className={BTN_PRIMARY}>
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
          </button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && (
          <div
            ref={errorRef}
            role="alert"
            className="rounded-xl border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor={`${uid}-name`} error={fieldErrors.name} className="sm:col-span-2">
            <input
              id={`${uid}-name`}
              className={INPUT_CLASS}
              value={name}
              maxLength={200}
              onChange={(e) => {
                setName(e.target.value)
                clearFieldError("name")
              }}
            />
          </Field>

          <Field label="Categoría" htmlFor={`${uid}-category`} error={fieldErrors.category}>
            <select
              id={`${uid}-category`}
              className={SELECT_CLASS}
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value)
                clearFieldError("category")
              }}
            >
              <option value="">{categories.length === 0 ? "Cargando..." : "Elige una categoría"}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio (S/)" htmlFor={`${uid}-price`} error={fieldErrors.price}>
              <input
                id={`${uid}-price`}
                inputMode="decimal"
                className={INPUT_CLASS}
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value)
                  clearFieldError("price")
                }}
              />
            </Field>
            <Field label="Stock" htmlFor={`${uid}-stock`} error={fieldErrors.stock}>
              <input
                id={`${uid}-stock`}
                inputMode="numeric"
                className={INPUT_CLASS}
                value={stock}
                onChange={(e) => {
                  setStock(e.target.value)
                  clearFieldError("stock")
                }}
              />
            </Field>
          </div>

          <Field
            label="Descripción"
            htmlFor={`${uid}-description`}
            error={fieldErrors.description}
            className="sm:col-span-2"
          >
            <textarea
              id={`${uid}-description`}
              rows={3}
              className={`${INPUT_CLASS} resize-none`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </div>

        {/* Imagen */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="mb-3 text-sm font-medium text-zinc-300">Imagen</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
              {shownImage ? (
                <img src={shownImage} alt="Vista previa" className="h-full w-full object-cover" />
              ) : (
                <Package className="h-8 w-8 text-zinc-600" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className={BTN_GHOST}>
                  <Upload className="h-4 w-4" />
                  Subir imagen
                </button>
                {canRemoveImage && (
                  <button type="button" onClick={handleRemoveImage} className={BTN_GHOST}>
                    <Trash2 className="h-4 w-4" />
                    Quitar imagen
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFile}
                className="hidden"
              />

              {removeImage && (
                <p className="text-xs text-amber-300">
                  La imagen subida se quitará al guardar.{" "}
                  <button type="button" onClick={() => setRemoveImage(false)} className="underline">
                    Deshacer
                  </button>
                </p>
              )}
              {fieldErrors.image && (
                <p role="alert" className="text-xs text-red-300">
                  {fieldErrors.image}
                </p>
              )}

              <Field
                label="…o usa la URL de una imagen"
                htmlFor={`${uid}-image-url`}
                error={fieldErrors.image_url}
                hint="Si hay imagen subida, la tienda muestra esa y no la URL."
              >
                <input
                  id={`${uid}-image-url`}
                  type="url"
                  placeholder="https://..."
                  className={INPUT_CLASS}
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value)
                    clearFieldError("image_url")
                  }}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Especificaciones */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-medium text-zinc-300">Especificaciones técnicas</p>
          <p className="mb-3 mt-1 text-xs text-zinc-500">
            Las usa el Smart Builder para verificar compatibilidad (por ejemplo: socket = AM5,
            ram_type = DDR5, watts = 650). Los números y true/false se guardan como tal.
          </p>

          <div className="space-y-2">
            {specs.map((row) => (
              <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <input
                  aria-label="Nombre de la especificación"
                  placeholder="socket"
                  className={INPUT_CLASS}
                  value={row.key}
                  onChange={(e) => updateSpec(row.id, "key", e.target.value)}
                />
                <input
                  aria-label="Valor de la especificación"
                  placeholder="AM5"
                  className={INPUT_CLASS}
                  value={row.value}
                  onChange={(e) => updateSpec(row.id, "value", e.target.value)}
                />
                <button
                  type="button"
                  aria-label="Quitar especificación"
                  onClick={() => removeSpec(row.id)}
                  className="rounded-xl border border-white/10 px-2.5 text-zinc-400 transition-colors hover:border-red-500/40 hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {fieldErrors.specifications && (
            <p role="alert" className="mt-2 text-xs text-red-300">
              {fieldErrors.specifications}
            </p>
          )}

          <button type="button" onClick={addSpec} className={`${BTN_GHOST} mt-3`}>
            <Plus className="h-4 w-4" />
            Añadir especificación
          </button>
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 accent-purple-500"
          />
          Visible en la tienda
        </label>
      </form>
    </Modal>
  )
}