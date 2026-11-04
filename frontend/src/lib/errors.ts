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