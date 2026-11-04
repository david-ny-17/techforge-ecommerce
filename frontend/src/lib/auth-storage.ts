const ACCESS_KEY = "techforge_access"
const REFRESH_KEY = "techforge_refresh"

// Evento que se dispara cuando la sesión deja de ser válida (refresh fallido)
export const AUTH_LOGOUT_EVENT = "techforge:auth-logout"

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export const getAccessToken = () => read(ACCESS_KEY)
export const getRefreshToken = () => read(REFRESH_KEY)

export function saveTokens(access: string, refresh?: string) {
  try {
    localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  } catch {
    // Si el almacenamiento falla, la sesión dura solo hasta recargar
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  } catch {
    // nada que hacer
  }
}