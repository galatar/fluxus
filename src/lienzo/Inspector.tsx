import { ClipboardList, FileText, Trash2, Upload } from 'lucide-react'
import { CONEXIONES, TIPOS, TIPOS_PASO } from '../catalogo'
import { CON_CAMPOS, textoCondicion, variablesDe, variablesUsadas } from '../dominio'
import { EditorCondicion } from '../editores/EditorCondicion'
import { bandaDe } from '../estructura'
import type { Conexion, ConexionData, Estructura, Nodo, NodoData, TipoConexion } from '../tipos'

export type QueEditar = 'campos' | 'plantilla' | 'requisitos'

interface Props {
  nodos: Nodo[]
  conexiones: Conexion[]
  estructura: Estructura
  onNodo: (id: string, cambios: Partial<NodoData>) => void
  onConexion: (id: string, cambios: Partial<ConexionData>) => void
  onBorrar: (ids: string[]) => void
  onAbrir: (id: string, que: QueEditar) => void
}

export function Inspector({ nodos, conexiones, estructura, onNodo, onConexion, onBorrar, onAbrir }: Props) {
  const nodosSel = nodos.filter((n) => n.selected)
  const conexSel = conexiones.filter((e) => e.selected)
  const variables = variablesDe(nodos)
  const titulo = (id: string) => nodos.find((n) => n.id === id)?.data.titulo ?? '?'

  if (nodosSel.length === 1 && conexSel.length === 0) {
    const { id, data } = nodosSel[0]
    const salidas = conexiones.filter((c) => c.source === id)
    if (data.tipo === 'grupo') {
      return (
        <>
          <div className="panel-titulo">Grupo</div>
          <p className="ayuda">{TIPOS.grupo.ayuda}. Arrastra sus esquinas para cambiar el tamaño.</p>
          <label>
            Título
            <input value={data.titulo} onChange={(e) => onNodo(id, { titulo: e.target.value })} />
          </label>
          <label>
            Notas
            <textarea rows={4} value={data.notas ?? ''} onChange={(e) => onNodo(id, { notas: e.target.value })} />
          </label>
          <BotonBorrar onClick={() => onBorrar([id])} />
        </>
      )
    }
    const carril = bandaDe(nodosSel[0], 'y', estructura.y0, estructura.carriles)
    const fase = bandaDe(nodosSel[0], 'x', estructura.x0, estructura.fases)
    return (
      <>
        <div className="panel-titulo">{TIPOS[data.tipo].nombre}</div>
        <p className="ayuda">{TIPOS[data.tipo].ayuda}</p>
        {(carril || fase) && (
          <p className="ubicacion">
            {carril && <span>Actor: {carril.nombre}</span>}
            {fase && <span>Fase: {fase.nombre}</span>}
          </p>
        )}
        <label>
          Título
          <input value={data.titulo} onChange={(e) => onNodo(id, { titulo: e.target.value })} />
        </label>
        <label>
          Detalle
          <input value={data.detalle ?? ''} placeholder="línea corta bajo el título" onChange={(e) => onNodo(id, { detalle: e.target.value })} />
        </label>
        <label>
          Tipo
          <select value={data.tipo} onChange={(e) => onNodo(id, { tipo: e.target.value as NodoData['tipo'] })}>
            {TIPOS_PASO.map((t) => (
              <option key={t} value={t}>
                {TIPOS[t].nombre}
              </option>
            ))}
          </select>
        </label>

        {CON_CAMPOS.includes(data.tipo) && (
          <Contenido
            titulo={data.tipo === 'paso' ? 'Datos que se anotan' : 'Campos'}
            items={(data.campos ?? []).map((c) => c.etiqueta + (c.obligatorio ? ' *' : ''))}
            vacio={data.tipo === 'paso' ? 'Esta tarea no anota datos.' : 'Sin campos todavía.'}
            boton={data.tipo === 'paso' ? 'Definir datos' : 'Diseñar formulario'}
            icono={<ClipboardList size={13} />}
            onAbrir={() => onAbrir(id, 'campos')}
          />
        )}
        {data.tipo === 'aportado' && (
          <Contenido
            titulo="Documentos que se piden"
            items={(data.requisitos ?? []).map((d) => d.nombre + (d.obligatorio ? ' *' : ''))}
            vacio="No se pide ningún documento."
            boton="Editar documentos"
            icono={<Upload size={13} />}
            onAbrir={() => onAbrir(id, 'requisitos')}
          />
        )}
        {data.tipo === 'documento' && (
          <Contenido
            titulo="Plantilla"
            items={data.plantilla?.cuerpo ? [`${data.plantilla.formato.toUpperCase()} · usa ${variablesUsadas(data.plantilla.cuerpo).length} datos`] : []}
            vacio="La plantilla está vacía."
            boton="Editar plantilla"
            icono={<FileText size={13} />}
            onAbrir={() => onAbrir(id, 'plantilla')}
          />
        )}
        {data.tipo === 'decision' && (
          <div className="seccion">
            <div className="seccion-titulo">Salidas</div>
            {salidas.length === 0 && <p className="ayuda">Conecta esta decisión con las cajas siguientes.</p>}
            {salidas.map((s) => (
              <div key={s.id} className="salida">
                <div className="salida-destino">→ {titulo(s.target)}</div>
                <input value={s.data?.etiqueta ?? ''} placeholder="etiqueta (sí, no…)" onChange={(e) => onConexion(s.id, { etiqueta: e.target.value })} />
                <EditorCondicion data={s.data} variables={variables} onCambio={(c) => onConexion(s.id, c)} />
              </div>
            ))}
          </div>
        )}

        {data.tipo === 'fin' && (
          <label>
            Resultado
            <select value={data.resultado ?? 'ok'} onChange={(e) => onNodo(id, { resultado: e.target.value as 'ok' | 'ko' })}>
              <option value="ok">Favorable</option>
              <option value="ko">Desfavorable / archivo</option>
            </select>
          </label>
        )}
        <label>
          Notas
          <textarea rows={4} value={data.notas ?? ''} placeholder="Qué pasa aquí, quién lo hace, normativa…" onChange={(e) => onNodo(id, { notas: e.target.value })} />
        </label>
        <BotonBorrar onClick={() => onBorrar([id])} />
      </>
    )
  }

  if (conexSel.length === 1 && nodosSel.length === 0) {
    const { id, data, source, target } = conexSel[0]
    const desdeDecision = nodos.find((n) => n.id === source)?.data.tipo === 'decision'
    return (
      <>
        <div className="panel-titulo">Conexión</div>
        <p className="ayuda">
          {titulo(source)} → {titulo(target)}
        </p>
        <label>
          Etiqueta
          <input value={data?.etiqueta ?? ''} placeholder="sí, no, enviar…" onChange={(e) => onConexion(id, { etiqueta: e.target.value })} />
        </label>
        <label>
          Tipo
          <select value={data?.tipo ?? 'normal'} onChange={(e) => onConexion(id, { tipo: e.target.value as TipoConexion })}>
            {Object.entries(CONEXIONES).map(([v, nombre]) => (
              <option key={v} value={v}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
        {desdeDecision && (
          <div className="seccion">
            <div className="seccion-titulo">Se toma este camino si…</div>
            <EditorCondicion data={data} variables={variables} onCambio={(c) => onConexion(id, c)} />
            {data?.condicion && !data.porDefecto && <p className="ayuda">{textoCondicion(data.condicion, variables)}</p>}
          </div>
        )}
        <BotonBorrar onClick={() => onBorrar([id])} />
      </>
    )
  }

  const total = nodosSel.length + conexSel.length
  return (
    <>
      <div className="panel-titulo">{total} elementos</div>
      <BotonBorrar onClick={() => onBorrar([...nodosSel, ...conexSel].map((x) => x.id))} />
    </>
  )
}

interface PropsContenido {
  titulo: string
  items: string[]
  vacio: string
  boton: string
  icono: React.ReactNode
  onAbrir: () => void
}

function Contenido({ titulo, items, vacio, boton, icono, onAbrir }: PropsContenido) {
  return (
    <div className="seccion">
      <div className="seccion-titulo">{titulo}</div>
      {items.length === 0 ? (
        <p className="ayuda">{vacio}</p>
      ) : (
        <ul className="resumen">
          {items.slice(0, 6).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
          {items.length > 6 && <li className="ayuda">y {items.length - 6} más…</li>}
        </ul>
      )}
      <button className="boton" onClick={onAbrir}>
        {icono} {boton}
      </button>
    </div>
  )
}

function BotonBorrar({ onClick }: { onClick: () => void }) {
  return (
    <button className="boton peligro" onClick={onClick}>
      <Trash2 size={13} /> Borrar
    </button>
  )
}
