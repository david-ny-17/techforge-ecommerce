import { useEffect, useRef, useState } from "react"

export interface PollingState<T> {
  data: T | null
  error: boolean
  loading: boolean
  lastUpdated: Date | null
}

// Repite `fetcher` cada `intervalMs`. Cambiar `resetKey` reinicia el ciclo de inmediato.
// Espera a que termine cada petición antes de programar la siguiente (nunca se solapan).
export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  resetKey: unknown = 0
): PollingState<T> {
  const [state, setState] = useState<PollingState<T>>({
    data: null,
    error: false,
    loading: true,
    lastUpdated: null,
  })
  const fetcherRef = useRef(fetcher)

  // Siempre se usa la versión más reciente de fetcher sin reiniciar el ciclo
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined

    const schedule = () => {
      if (!cancelled) timer = window.setTimeout(tick, intervalMs)
    }

    const tick = async () => {
      // Con la pestaña oculta no se consulta: se ahorran peticiones
      if (document.hidden) {
        schedule()
        return
      }
      try {
        const data = await fetcherRef.current()
        if (!cancelled) {
          setState({ data, error: false, loading: false, lastUpdated: new Date() })
        }
      } catch {
        // Se conservan los últimos datos; solo se marca el error
        if (!cancelled) setState((prev) => ({ ...prev, error: true, loading: false }))
      }
      schedule()
    }

    // Al volver a la pestaña se refresca al instante
    const handleVisibility = () => {
      if (!document.hidden) {
        window.clearTimeout(timer)
        void tick()
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)
    void tick()

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [intervalMs, resetKey])

  return state
}