import { Trash2 } from 'lucide-react'
import { CONEXIONES, ORDEN_TIPOS, TIPOS } from '../catalogo'
import type { Conexion, Nodo, NodoData, TipoConexion } from '../tipos'

interface Props {
  nodos: Nodo[]
  conexiones: Conexion[]
  onNodo: (id: string, cambios: Partial<NodoData>) => void
  onConexion: (id: string, cambios: Partial<Conexion['data']>) => void
  onBorrar: (ids: string[]) => void
}

export function Inspector({ nodos, conexiones, onNodo, onConexion, onBorrar }: Props) {
  if (nodos.length === 1 && conexiones.length === 0) {
    const { id, data } = nodos[0]
    return (
      <>
        <div className="panel-titulo">{TIPOS[data.tipo].nombre}</div>
        <p className="ayuda">{TIPOS[data.tipo].ayuda}</p>
        <label>
          Título
          <input value={data.titulo} onChange={(e) => onNodo(id, { titulo: e.target.value })} autoFocus />
        </label>
        <label>
          Detalle
          <input value={data.detalle ?? ''} placeholder="línea corta bajo el título" onChange={(e) => onNodo(id, { detalle: e.target.value })} />
        </label>
        <label>
          Tipo
          <select value={data.tipo} onChange={(e) => onNodo(id, { tipo: e.target.value as NodoData['tipo'] })}>
            {ORDEN_TIPOS.map((t) => (
              <option key={t} value={t}>
                {TIPOS[t].nombre}
              </option>
            ))}
          </select>
        </label>
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
          <textarea rows={5} value={data.notas ?? ''} placeholder="Qué pasa aquí, quién lo hace, normativa…" onChange={(e) => onNodo(id, { notas: e.target.value })} />
        </label>
        <BotonBorrar onClick={() => onBorrar([id])} />
      </>
    )
  }

  if (conexiones.length === 1 && nodos.length === 0) {
    const { id, data } = conexiones[0]
    return (
      <>
        <div className="panel-titulo">Conexión</div>
        <label>
          Etiqueta
          <input value={data?.etiqueta ?? ''} placeholder="sí, no, enviar…" onChange={(e) => onConexion(id, { etiqueta: e.target.value })} autoFocus />
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
        <BotonBorrar onClick={() => onBorrar([id])} />
      </>
    )
  }

  const total = nodos.length + conexiones.length
  return (
    <>
      <div className="panel-titulo">{total} elementos</div>
      <BotonBorrar onClick={() => onBorrar([...nodos, ...conexiones].map((x) => x.id))} />
    </>
  )
}

function BotonBorrar({ onClick }: { onClick: () => void }) {
  return (
    <button className="boton peligro" onClick={onClick}>
      <Trash2 size={13} /> Borrar
    </button>
  )
}
