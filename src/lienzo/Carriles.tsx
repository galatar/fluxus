import { useReactFlow, ViewportPortal } from '@xyflow/react'
import type { PointerEvent } from 'react'
import { aParrilla } from '../almacen'
import { contenido, MIN_BANDA, tramos, type Eje } from '../estructura'
import type { Estructura, Nodo } from '../tipos'

const MARGEN = 60 // espacio para el nombre del carril, a la izquierda
const CABECERA = 44 // alto de la cabecera de las fases

/** Color de cada fase, por turnos. */
const COLORES_FASE = ['--c-documento', '--c-formulario', '--c-espera', '--c-decision', '--c-paso']

interface Props {
  estructura: Estructura
  nodos: Nodo[]
  onTamano: (eje: Eje, indice: number, tamano: number) => void
  onAbrir: () => void
}

/** Carriles y fases dibujados detrás de las cajas, en coordenadas del lienzo. */
export function Carriles({ estructura, nodos, onTamano, onAbrir }: Props) {
  const { getZoom } = useReactFlow()
  const { carriles, fases, x0, y0 } = estructura
  if (carriles.length === 0 && fases.length === 0) return null

  const c = contenido(nodos) ?? { x1: x0, y1: y0, x2: x0 + 600, y2: y0 + 240 }
  const tc = tramos(y0, carriles)
  const tf = tramos(x0, fases)
  const finFases = tf.at(-1)?.fin ?? -Infinity
  const finCarriles = tc.at(-1)?.fin ?? -Infinity

  const izquierda = Math.min(fases.length ? x0 : Infinity, c.x1 - 40) - (carriles.length ? MARGEN : 0)
  const derecha = Math.max(finFases, c.x2 + 60)
  const arriba = carriles.length ? y0 : c.y1 - 40
  const abajo = Math.max(finCarriles, c.y2 + 40)

  // Arrastrar el borde de un carril o de una fase cambia su tamaño.
  const arrastrar = (eje: Eje, i: number, tamano0: number) => (ev: PointerEvent<HTMLDivElement>) => {
    ev.stopPropagation()
    const el = ev.currentTarget
    el.setPointerCapture(ev.pointerId)
    const desde = eje === 'y' ? ev.clientY : ev.clientX
    const mover = (e: globalThis.PointerEvent) => {
      const d = ((eje === 'y' ? e.clientY : e.clientX) - desde) / getZoom()
      onTamano(eje, i, Math.max(MIN_BANDA, aParrilla(tamano0 + d)))
    }
    const soltar = () => {
      el.removeEventListener('pointermove', mover)
      el.removeEventListener('pointerup', soltar)
    }
    el.addEventListener('pointermove', mover)
    el.addEventListener('pointerup', soltar)
  }

  return (
    <ViewportPortal>
      <div className="estructura">
        {tc.map((t, i) => (
          <div
            key={t.id}
            className={`carril${i % 2 ? ' impar' : ''}`}
            style={{ left: izquierda, top: t.inicio, width: derecha - izquierda, height: t.tamano }}
          >
            <button className="carril-nombre nopan nodrag" onClick={onAbrir} title="Editar carriles y fases" style={{ width: MARGEN }}>
              <span>{t.nombre}</span>
            </button>
            <div className="asa-carril nopan nodrag" onPointerDown={arrastrar('y', i, t.tamano)} title="Arrastra para cambiar el alto" />
          </div>
        ))}

        {tf.map((t, i) => (
          <div key={t.id}>
            <div
              className="fase-cabecera"
              style={{ left: t.inicio, top: arriba - CABECERA, width: t.tamano, height: CABECERA, color: `var(${COLORES_FASE[i % COLORES_FASE.length]})` }}
            >
              <button className="fase-nombre nopan nodrag" onClick={onAbrir} title="Editar carriles y fases">
                {t.nombre}
              </button>
              <div className="asa-fase nopan nodrag" onPointerDown={arrastrar('x', i, t.tamano)} title="Arrastra para cambiar el ancho" />
            </div>
            {i < tf.length - 1 && <div className="fase-linea" style={{ left: t.fin, top: arriba, height: abajo - arriba }} />}
          </div>
        ))}
      </div>
    </ViewportPortal>
  )
}
