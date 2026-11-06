import axios from "axios"

export interface ApiErrorInfo {
  message: string
  fields: Record<string, string>
}

export function parseApiError(
  err: unknown,
  fallback = "Ocurrió un error inesperado. Inténtalo de nuevo."
): ApiErrorInfo {
  if (!axios.isAxiosError(err)) return { message: fallback, fields: {} }

  if (!err.response) {
    return {
      message: "No se pudo conectar con el servidor. Verifica que esté activo.",
      fields: {},
    }
  }

  const { status, data } = err.response

  // Credenciales incorrectas (login)
  if (status === 401) {
    return { message: "Usuario o contraseña incorrectos.", fields: {} }
  }

  // Errores de validación de DRF: { campo: ["mensaje", ...] }
  if (status === 400 && data && typeof data === "object") {
    const fields: Record<string, string> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const text = Array.isArray(value)
        ? value.join(" ")
        : typeof value === "string"
          ? value
          : null
      if (text) fields[key] = text
    }
    if (Object.keys(fields).length > 0) {
      return { message: "Revisa los datos ingresados.", fields }
    }
  }

  return { message: fallback, fields: {} }
}

export function parseCheckoutError(err: unknown): string {
  if (axios.isAxiosError(err) && err.response) {
    const { status, data } = err.response

    if (status === 401) {
      return "Tu sesión expiró. Inicia sesión nuevamente para pagar."
    }

    if (status === 400 && data && typeof data === "object") {
      const body = data as Record<string, unknown>

      // Pago rechazado, stock insuficiente, producto no disponible...
      if (typeof body.detail === "string") return body.detail

      const cardErrors = (body.payment_info as Record<string, unknown> | undefined)
        ?.card_number
      if (Array.isArray(cardErrors) && cardErrors.length > 0) {
        return cardErrors.join(" ")
      }

      if (body.cart_items) {
        return "Hay un problema con los productos de tu carrito. Revísalo e inténtalo de nuevo."
      }
    }

    if (status >= 500) {
      return "El servidor tuvo un problema. Inténtalo de nuevo en unos minutos."
    }
  }

  return parseApiError(err).message
}

// Mensajes de error del Smart Builder
export function parseSmartBuilderError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
      return "La IA tardó demasiado en responder. Inténtalo de nuevo."
    }

    if (err.response) {
      const { status, data } = err.response

      // Límite de uso del backend (DRF responde en inglés)
      if (status === 429) {
        return "Demasiadas consultas seguidas. Espera un momento e inténtalo de nuevo."
      }

      if (data && typeof data === "object") {
        const body = data as Record<string, unknown>
        if (typeof body.detail === "string") return body.detail
        if (Array.isArray(body.prompt)) return body.prompt.join(" ")
      }

      if (status >= 500) {
        return "El asistente no está disponible por ahora. Inténtalo más tarde."
      }
    }
  }

  return parseApiError(err).message
}