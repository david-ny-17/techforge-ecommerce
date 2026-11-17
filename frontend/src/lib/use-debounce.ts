import { useEffect, useState } from "react"

// Devuelve `value`, pero solo cuando deja de cambiar durante `delayMs`
// (así el buscador no consulta al servidor con cada letra).
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])

  return debounced
}