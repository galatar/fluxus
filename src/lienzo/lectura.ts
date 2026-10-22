import { createContext } from 'react'
import type { Conexion } from '../tipos'

export type ModoLectura = 'camino' | 'foco'

/** Conexiones iluminadas en modo lectura (null si el modo está apagado). Lo usan las etiquetas. */
export const LecturaContexto = createContext<Set<string> | null>(null)

export interface Resaltado {
  nodos: Set<string>
  conexiones: Set<string>
}

/**
 * Qué se queda iluminado en modo lectura.
 * - foco: las cajas de partida y sus vecinas directas.
 * - camino: todo lo que lleva hasta ellas y todo lo que sale de ellas.
 */
export function resaltar(modo: ModoLectura, desde: string[], conexiones: Conexion[]): Resaltado {
  const nodos = new Set(desde)
  const usadas = new Set<string>()

  if (modo === 'foco') {
    for (const c of conexiones) {
      if (nodos.has(c.source) || nodos.has(c.target)) usadas.add(c.id)
    }
    for (const c of conexiones) {
      if (usadas.has(c.id)) nodos.add(c.source).add(c.target)
    }
    return { nodos, conexiones: usadas }
  }

  const recorrer = (haciaDelante: boolean) => {
    const vistos = new Set(desde)
    const pendientes = [...desde]
    while (pendientes.length) {
      const id = pendientes.pop()!
      for (const c of conexiones) {
        const [de, a] = haciaDelante ? [c.source, c.target] : [c.target, c.source]
        if (de !== id) continue
        usadas.add(c.id)
        nodos.add(a)
        if (!vistos.has(a)) {
          vistos.add(a)
          pendientes.push(a)
        }
      }
    }
  }
  recorrer(false)
  recorrer(true)
  return { nodos, conexiones: usadas }
}
