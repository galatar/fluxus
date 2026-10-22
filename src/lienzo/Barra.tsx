import { useReactFlow, useViewport } from '@xyflow/react'
import { CircleCheck, Focus, ImageDown, Maximize, Minus, Plus, Route, TriangleAlert } from 'lucide-react'
import type { ModoLectura } from './lectura'

interface Props {
  modo: ModoLectura | null
  onModo: (m: ModoLectura | null) => void
  revisando: boolean
  onRevisar: () => void
  errores: number
  avisos: number
  onImagen: (formato: 'png' | 'svg') => void
}

/** Barra inferior al estilo archify: lectura, revisión, imagen y zoom. */
export function Barra({ modo, onModo, revisando, onRevisar, errores, avisos, onImagen }: Props) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const { zoom } = useViewport()
  const alternar = (m: ModoLectura) => onModo(modo === m ? null : m)
  const total = errores + avisos

  return (
    <div className="barra">
      <button className={modo === 'camino' ? 'activo' : ''} onClick={() => alternar('camino')} title="Resalta todo lo que lleva a la caja elegida y lo que sale de ella">
        <Route size={14} /> Camino
      </button>
      <button className={modo === 'foco' ? 'activo' : ''} onClick={() => alternar('foco')} title="Resalta la caja elegida y sus vecinas">
        <Focus size={14} /> Foco
      </button>
      <span className="barra-sep" />
      <button className={revisando ? 'activo' : ''} onClick={onRevisar} title="Busca cajas sueltas, decisiones incompletas, plantillas rotas…">
        {total === 0 ? <CircleCheck size={14} /> : <TriangleAlert size={14} />} Revisar
        {total > 0 && <span className={`insignia${errores ? ' error' : ''}`}>{total}</span>}
      </button>
      <span className="barra-sep" />
      <button onClick={() => onImagen('png')} title="Descargar el esquema como imagen PNG">
        <ImageDown size={14} /> PNG
      </button>
      <button onClick={() => onImagen('svg')} title="Descargar el esquema como SVG">
        SVG
      </button>
      <span className="barra-sep" />
      <button onClick={() => zoomOut({ duration: 150 })} title="Alejar" aria-label="Alejar">
        <Minus size={14} />
      </button>
      <span className="zoom">{Math.round(zoom * 100)}%</span>
      <button onClick={() => zoomIn({ duration: 150 })} title="Acercar" aria-label="Acercar">
        <Plus size={14} />
      </button>
      <button onClick={() => fitView({ duration: 250, padding: 0.1 })} title="Ver todo" aria-label="Ver todo">
        <Maximize size={14} />
      </button>
    </div>
  )
}
