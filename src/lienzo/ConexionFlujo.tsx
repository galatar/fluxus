import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useNodes, type EdgeProps } from '@xyflow/react'
import { useContext } from 'react'
import { textoCondicion, variablesDe } from '../dominio'
import { LecturaContexto } from './lectura'
import type { Conexion, Nodo, TipoConexion } from '../tipos'

export function ConexionFlujo(props: EdgeProps<Conexion>) {
  const { id, data, selected } = props
  const tipo = data?.tipo ?? 'normal'
  const [path, x, y] = getSmoothStepPath({ ...props, borderRadius: 14, offset: 22 })
  const nodos = useNodes<Nodo>()
  const iluminadas = useContext(LecturaContexto)
  // Sin etiqueta escrita a mano, mostramos la condición.
  const etiqueta = data?.etiqueta || (data?.porDefecto ? 'en otro caso' : textoCondicion(data?.condicion, variablesDe(nodos)))

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={`url(#flecha-${tipo})`}
        className={`arista a-${tipo}${selected ? ' seleccionada' : ''}`}
        interactionWidth={18}
      />
      {etiqueta && (
        <EdgeLabelRenderer>
          <div className={`etiqueta a-${tipo}${iluminadas && !iluminadas.has(id) ? ' atenuado' : ''}`} style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}>
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
