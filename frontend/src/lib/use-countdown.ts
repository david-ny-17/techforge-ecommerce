import { useSyncExternalStore } from "react"

export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number // milisegundos que faltan (0 si ya terminó)
  expired: boolean
}

// Convierte milisegundos restantes en días, horas, minutos y segundos.
// Los segundos se redondean hacia arriba: el reloj llega a 00:00:00 justo cuando termina.
export function splitDuration(ms: number): CountdownParts {
  const left = Number.isFinite(ms) ? Math.max(0, ms) : 0
  const total = Math.ceil(left / 1000)
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    totalMs: left,
    expired: left <= 0,
  }
}

// Diferencia entre el reloj del servidor y el de este equipo. Se calcula UNA vez, cuando
// llega la respuesta de /promotions/ (no durante el render), y se pasa a useCountdown.
export function getServerOffset(serverTime: string): number {
  const server = Date.parse(serverTime)
  return Number.isNaN(server) ? 0 : server - Date.now()
}

// El "ahora" se lee del reloj con useSyncExternalStore: React vuelve a dibujar solo
// cuando cambia el segundo, y no hace falta guardar la hora en un estado.
function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 500)
  return () => window.clearInterval(id)
}

const getNow = () => Math.floor(Date.now() / 1000) * 1000

// Cuenta regresiva hasta `endsAt` (fecha ISO). `serverOffsetMs` corrige el desfase del reloj.
export function useCountdown(endsAt: string, serverOffsetMs = 0): CountdownParts {
  const now = useSyncExternalStore(subscribe, getNow)
  const end = Date.parse(endsAt)
  return splitDuration(end - (now + serverOffsetMs))
}