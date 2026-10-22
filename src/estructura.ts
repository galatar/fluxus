import { aParrilla } from './almacen'
import type { Banda, Estructura, Nodo } from './tipos'

export type Eje = 'x' | 'y'

export const ESTRUCTURA_VACIA: Estructura = { carriles: [], y0: 0, fases: [], x0: 0 }
export const ALTO_CARRIL = 240
export const ANCHO_FASE = 600
export const MIN_BANDA = 120

/** Rectángulo de una caja en coordenadas del lienzo (las cajas se colocan por su centro). */
export function caja(n: Nodo) {
  const w = n.measured?.width ?? n.width ?? 220
  const h = n.measured?.height ?? n.height ?? 74
  return { x1: n.position.x - w / 2, y1: n.position.y - h / 2, x2: n.position.x + w / 2, y2: n.position.y + h / 2 }
}

/** Extremos de todas las cajas que no son grupos, o null si no hay ninguna. */
export function contenido(nodos: Nodo[]) {
  const cajas = nodos.filter((n) => n.data.tipo !== 'grupo').map(caja)
  if (cajas.length === 0) return null
  return {
    x1: Math.min(...cajas.map((c) => c.x1)),
    y1: Math.min(...cajas.map((c) => c.y1)),
    x2: Math.max(...cajas.map((c) => c.x2)),
    y2: Math.max(...cajas.map((c) => c.y2)),
  }
}

export interface Tramo extends Banda {
  inicio: number
  fin: number
}

export function tramos(origen: number, bandas: Banda[]): Tramo[] {
  let a = origen
  return bandas.map((b) => {
    const t = { ...b, inicio: a, fin: a + b.tamano }
    a += b.tamano
    return t
  })
}

const coordenada = (n: Nodo, eje: Eje) => (eje === 'x' ? n.position.x : n.position.y)

/** Carril o fase en el que cae el centro de una caja. */
export function bandaDe(n: Nodo, eje: Eje, origen: number, bandas: Banda[]) {
  const v = coordenada(n, eje)
  return tramos(origen, bandas).find((t) => v >= t.inicio && v < t.fin)
}

/** Cajas cuyo centro queda dentro de un grupo. */
export function dentroDe(grupo: Nodo, nodos: Nodo[]) {
  const g = caja(grupo)
  return nodos.filter(
    (n) => n.id !== grupo.id && n.data.tipo !== 'grupo' && n.position.x > g.x1 && n.position.x < g.x2 && n.position.y > g.y1 && n.position.y < g.y2,
  )
}

/**
 * Mueve las cajas para que sigan en su carril o fase cuando estos cambian de
 * tamaño, de orden o desaparecen (como las filas de una hoja de cálculo).
 * Las cajas de una banda borrada se quedan donde están.
 */
export function reubicar(nodos: Nodo[], eje: Eje, origen: number, viejas: Banda[], nuevas: Banda[]) {
  if (viejas.length === 0) return nodos
  const antes = tramos(origen, viejas)
  const despues = new Map(tramos(origen, nuevas).map((t) => [t.id, t]))
  const finAntes = antes[antes.length - 1].fin
  const finDespues = origen + nuevas.reduce((s, b) => s + b.tamano, 0)

  return nodos.map((n) => {
    const v = coordenada(n, eje)
    const t = antes.find((t) => v >= t.inicio && v < t.fin)
    const d = t ? (despues.has(t.id) ? despues.get(t.id)!.inicio - t.inicio : 0) : v >= finAntes ? finDespues - finAntes : 0
    if (!d) return n
    return { ...n, position: eje === 'x' ? { ...n.position, x: n.position.x + d } : { ...n.position, y: n.position.y + d } }
  })
}

/** Primer carril o fase: cubre todo lo que ya está dibujado. */
export function primeraBanda(nodos: Nodo[], eje: Eje) {
  const c = contenido(nodos)
  const defecto = eje === 'y' ? ALTO_CARRIL : ANCHO_FASE
  if (!c) return { origen: 0, tamano: defecto }
  const [a, b] = eje === 'y' ? [c.y1, c.y2] : [c.x1, c.x2]
  const origen = aParrilla(a - 60)
  return { origen, tamano: Math.max(defecto, aParrilla(b + 60 - origen)) }
}
