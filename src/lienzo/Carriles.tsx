import { useReactFlow, ViewportPortal } from '@xyflow/react'
import type { PointerEvent } from 'react'
import { aParrilla } from '../almacen'
import { CABECERA_FASE as CABECERA, MARGEN_CARRIL as MARGEN, marco, MIN_BANDA, tramos, type Eje } from '../estructura'
import type { Estructura, Nodo } from '../tipos'

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

  const tc = tramos(y0, carriles)
  const tf = tramos(x0, fases)
  const { izquierda, derecha, arriba, abajo } = marco(estructura, nodos)

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
