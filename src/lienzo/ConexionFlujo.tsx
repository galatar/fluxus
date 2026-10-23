import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, Position, useNodes, useReactFlow, type EdgeProps } from '@xyflow/react'
import { useContext, type PointerEvent } from 'react'
import { aParrilla } from '../almacen'
import { textoCondicion, variablesDe } from '../dominio'
import { LecturaContexto } from './lectura'
import type { Conexion, Nodo, TipoConexion } from '../tipos'

/** Separación entre la caja y el primer codo de la flecha. */
const SEPARACION = 22

const SALIDA: Record<Position, { x: number; y: number }> = {
  [Position.Left]: { x: -1, y: 0 },
  [Position.Right]: { x: 1, y: 0 },
  [Position.Top]: { x: 0, y: -1 },
  [Position.Bottom]: { x: 0, y: 1 },
}

type Extremos = Pick<EdgeProps, 'sourceX' | 'sourceY' | 'targetX' | 'targetY' | 'sourcePosition' | 'targetPosition'>

/**
 * Tramo central de la flecha, el que se puede desplazar a mano: en qué eje se
 * mueve y dónde queda sin desvío. Solo existe cuando la flecha sale y entra por
 * lados opuestos (derecha → izquierda, abajo → arriba…) y no es una recta.
 * Repite el cálculo de getSmoothStepPath de React Flow.
 */
function tramoCentral(p: Extremos): { eje: 'x' | 'y'; base: number } | null {
  const ds = SALIDA[p.sourcePosition]
  const dt = SALIDA[p.targetPosition]
  const principal = ds.x !== 0 ? 'x' : 'y'
  if (ds[principal] * dt[principal] !== -1) return null
  const s = { x: p.sourceX + ds.x * SEPARACION, y: p.sourceY + ds.y * SEPARACION }
  const t = { x: p.targetX + dt.x * SEPARACION, y: p.targetY + dt.y * SEPARACION }
  const haciaDestino = ds[principal] === (s[principal] < t[principal] ? 1 : -1)
  const eje = haciaDestino ? principal : principal === 'x' ? 'y' : 'x'
  const otro = eje === 'x' ? 'y' : 'x'
  if (Math.abs(s[otro] - t[otro]) < 1) return null
  return { eje, base: (s[eje] + t[eje]) / 2 }
}

export function ConexionFlujo(props: EdgeProps<Conexion>) {
  const { id, data, selected } = props
  const tipo = data?.tipo ?? 'normal'
  const tramo = tramoCentral(props)
  const centro = tramo && data?.desvio ? { [tramo.eje === 'x' ? 'centerX' : 'centerY']: tramo.base + data.desvio } : {}
  const [path, x, y] = getSmoothStepPath({ ...props, ...centro, borderRadius: 14, offset: SEPARACION })
  const nodos = useNodes<Nodo>()
  const { screenToFlowPosition, updateEdgeData } = useReactFlow()
  const iluminadas = useContext(LecturaContexto)
  // Sin etiqueta escrita a mano, mostramos la condición.
  const etiqueta = data?.etiqueta || (data?.porDefecto ? 'en otro caso' : textoCondicion(data?.condicion, variablesDe(nodos)))
  const movible = selected && tramo !== null

  // Arrastrar el tramo central lo desplaza; doble clic lo devuelve a su sitio.
  const arrastrar = (ev: PointerEvent<HTMLDivElement>) => {
    if (!tramo) return
    ev.stopPropagation()
    const el = ev.currentTarget
    el.setPointerCapture(ev.pointerId)
    const mover = (e: globalThis.PointerEvent) => {
      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      updateEdgeData(id, { desvio: aParrilla(p[tramo.eje]) - tramo.base })
    }
    const soltar = () => {
      el.removeEventListener('pointermove', mover)
      el.removeEventListener('pointerup', soltar)
    }
    el.addEventListener('pointermove', mover)
    el.addEventListener('pointerup', soltar)
  }
  const asa = movible
    ? {
        onPointerDown: arrastrar,
        onDoubleClick: () => updateEdgeData(id, { desvio: undefined }),
        title: 'Arrastra para mover el tramo; doble clic para recolocarlo',
      }
    : {}
  const cursor = movible ? ` movible eje-${tramo.eje}` : ''

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={`url(#flecha-${tipo})`}
        className={`arista a-${tipo}${selected ? ' seleccionada' : ''}`}
        interactionWidth={18}
      />
      {(etiqueta || movible) && (
        <EdgeLabelRenderer>
          <div
            className={`${etiqueta ? 'etiqueta' : 'asa-tramo'} a-${tipo}${cursor}${iluminadas && !iluminadas.has(id) ? ' atenuado' : ''} nodrag nopan`}
            style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
            {...asa}
          >
            {etiqueta}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

const TIPOS_FLECHA: TipoConexion[] = ['normal', 'alternativa', 'error']

/** Puntas de flecha compartidas; toman el color del tema vía CSS. */
export function Flechas() {
  return (
    <svg className="defs-flechas" aria-hidden>
      <defs>
        {TIPOS_FLECHA.map((t) => (
          <marker key={t} id={`flecha-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="13" markerHeight="13" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className={`punta a-${t}`} />
          </marker>
        ))}
      </defs>
    </svg>
  )
}
