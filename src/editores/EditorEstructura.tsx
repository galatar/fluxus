import { Plus } from 'lucide-react'
import type { Eje } from '../estructura'
import type { Banda, Estructura, Nodo } from '../tipos'
import { bandaDe } from '../estructura'
import { BotonesFila } from './Filas'
import { mover } from './listas'

interface Props {
  estructura: Estructura
  nodos: Nodo[]
  onBandas: (eje: Eje, bandas: Banda[]) => void
  onAnadir: (eje: Eje) => void
}

export function EditorEstructura({ estructura, nodos, onBandas, onAnadir }: Props) {
  return (
    <div className="dos-columnas iguales">
      <Lista
        eje="y"
        titulo="Carriles · quién hace cada cosa"
        ayuda="Una fila por actor: persona solicitante, unidad, responsable, sistema… Arrastra su borde inferior en el lienzo para cambiar el alto."
        boton="Añadir carril"
        bandas={estructura.carriles}
        origen={estructura.y0}
        nodos={nodos}
        onBandas={(b) => onBandas('y', b)}
        onAnadir={() => onAnadir('y')}
      />
      <Lista
        eje="x"
        titulo="Fases · en qué momento"
        ayuda="Columnas para las etapas del procedimiento: solicitud, instrucción, resolución… Arrastra su borde derecho en la cabecera para cambiar el ancho."
        boton="Añadir fase"
        bandas={estructura.fases}
        origen={estructura.x0}
        nodos={nodos}
        onBandas={(b) => onBandas('x', b)}
        onAnadir={() => onAnadir('x')}
      />
    </div>
  )
}

interface PropsLista {
  eje: Eje
  titulo: string
  ayuda: string
  boton: string
  bandas: Banda[]
  origen: number
  nodos: Nodo[]
  onBandas: (b: Banda[]) => void
  onAnadir: () => void
}

function Lista({ eje, titulo, ayuda, boton, bandas, origen, nodos, onBandas, onAnadir }: PropsLista) {
  const cuantas = (id: string) => nodos.filter((n) => n.data.tipo !== 'grupo' && bandaDe(n, eje, origen, bandas)?.id === id).length

  const quitar = (b: Banda) => {
    const n = cuantas(b.id)
    if (n > 0 && !confirm(`«${b.nombre}» tiene ${n} caja${n === 1 ? '' : 's'}. Se quedarán donde están, fuera de ${eje === 'y' ? 'carril' : 'fase'}. ¿Quitarlo?`)) return
    onBandas(bandas.filter((x) => x.id !== b.id))
  }

  return (
    <section>
      <div className="seccion-titulo">{titulo}</div>
      <p className="ayuda">{ayuda}</p>
      {bandas.map((b, i) => (
        <div key={b.id} className="tarjeta tarjeta-fila">
          <label className="crece">
            Nombre
            <input value={b.nombre} onChange={(e) => onBandas(bandas.map((x) => (x.id === b.id ? { ...x, nombre: e.target.value } : x)))} />
          </label>
          <span className="contador-cajas">{cuantas(b.id)} cajas</span>
          <BotonesFila i={i} total={bandas.length} onMover={(d) => onBandas(mover(bandas, i, d))} onQuitar={() => quitar(b)} />
        </div>
      ))}
      <button className="boton" onClick={onAnadir}>
        <Plus size={14} /> {boton}
      </button>
    </section>
  )
}
