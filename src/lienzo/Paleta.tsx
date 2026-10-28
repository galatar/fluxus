import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Panel } from '@xyflow/react'
import { ChevronDown, ChevronUp, GripHorizontal, Rows3 } from 'lucide-react'
import { ORDEN_TIPOS, TIPOS } from '../catalogo'
import type { Tipo } from '../tipos'

const CLAVE = 'fluxus:paleta'
const MARGEN = 8

interface Estado {
  /** Desplazamiento respecto al rincón superior izquierdo donde nace el panel. */
  x: number
  y: number
  plegada: boolean
}

const INICIAL: Estado = { x: 0, y: 0, plegada: false }

function cargar(): Estado {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) ?? 'null')
    if (v && typeof v.x === 'number' && typeof v.y === 'number') return { x: v.x, y: v.y, plegada: v.plegada === true }
  } catch {
    // Sin almacenamiento o valor roto: se usa la posición de siempre.
  }
  return INICIAL
}

interface Props {
  mime: string
  onAgregar: (tipo: Tipo) => void
  onEstructura: () => void
}

/** Paleta de elementos: se agarra por la cabecera para moverla y se pliega para despejar el diagrama. */
export function Paleta({ mime, onAgregar, onEstructura }: Props) {
  const [estado, setEstado] = useState(cargar)
  const panel = useRef<HTMLDivElement>(null)
  const actual = useRef(estado)
  actual.current = estado
  const arrastre = useRef<{ px: number; py: number; x: number; y: number } | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado))
    } catch {
      // La posición solo dura esta sesión.
    }
  }, [estado])

  /** Deja el panel dentro del lienzo, sea cual sea el tamaño de la ventana. */
  const encajar = (x: number, y: number) => {
    const el = panel.current
    const marco = el?.offsetParent
    if (!el || !marco) return { x, y }
    // Posición natural del panel (sin desplazamiento): su rincón actual menos lo ya movido.
    const r = el.getBoundingClientRect()
    const m = marco.getBoundingClientRect()
    const baseX = r.left - m.left - actual.current.x
    const baseY = r.top - m.top - actual.current.y
    return {
      x: Math.min(Math.max(x, MARGEN - baseX), m.width - r.width - MARGEN - baseX),
      y: Math.min(Math.max(y, MARGEN - baseY), m.height - r.height - MARGEN - baseY),
    }
  }

  // Si la ventana se encoge, el panel no se queda fuera de la vista.
  useEffect(() => {
    const reencajar = () => setEstado((e) => ({ ...e, ...encajar(e.x, e.y) }))
    reencajar()
    window.addEventListener('resize', reencajar)
    return () => window.removeEventListener('resize', reencajar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.plegada])

  const empezar = (ev: PointerEvent<HTMLDivElement>) => {
    if ((ev.target as HTMLElement).closest('button')) return
    ev.currentTarget.setPointerCapture(ev.pointerId)
    arrastre.current = { px: ev.clientX, py: ev.clientY, x: estado.x, y: estado.y }
  }
  const mover = (ev: PointerEvent<HTMLDivElement>) => {
    const a = arrastre.current
    if (!a) return
    const nuevo = encajar(a.x + ev.clientX - a.px, a.y + ev.clientY - a.py)
    setEstado((e) => ({ ...e, ...nuevo }))
  }
  const soltar = () => {
    arrastre.current = null
  }

  return (
    <Panel
      ref={panel}
      position="top-left"
      className={`panel paleta${estado.plegada ? ' plegada' : ''}`}
      style={{ transform: `translate(${estado.x}px, ${estado.y}px)` }}
    >
        <div
          className="paleta-cabecera"
          onPointerDown={empezar}
          onPointerMove={mover}
          onPointerUp={soltar}
          onPointerCancel={soltar}
          title="Arrastra para mover el panel"
        >
          <GripHorizontal size={14} className="paleta-asa" />
          <span className="panel-titulo">Elementos</span>
          <button
            className="paleta-plegar"
            onClick={() => setEstado((e) => ({ ...e, plegada: !e.plegada }))}
            title={estado.plegada ? 'Mostrar los elementos' : 'Ocultar los elementos'}
            aria-expanded={!estado.plegada}
          >
            {estado.plegada ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
        {!estado.plegada && (
          <>
            {ORDEN_TIPOS.map((t) => {
              const Icono = TIPOS[t].icono
              return (
                <button
                  key={t}
                  className={`paleta-item t-${t}`}
                  draggable
                  onDragStart={(ev) => {
                    ev.dataTransfer.setData(mime, t)
                    ev.dataTransfer.effectAllowed = 'move'
                  }}
                  onClick={() => onAgregar(t)}
                  title={`${TIPOS[t].ayuda}. Arrastra al lienzo o haz clic.`}
                >
                  <span className="muestra">
                    <Icono size={12} />
                  </span>
                  {TIPOS[t].nombre}
                </button>
              )
            })}
            <div className="paleta-separador" />
            <button className="paleta-item" onClick={onEstructura} title="Filas por actor y columnas por fase">
              <span className="muestra neutra">
                <Rows3 size={12} />
              </span>
              Carriles y fases
            </button>
          </>
        )}
    </Panel>
  )
}
