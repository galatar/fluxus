import { CONEXIONES, ORDEN_TIPOS, TIPOS } from '../catalogo'
import type { Conexion, Nodo, TipoConexion } from '../tipos'

export function Leyenda({ nodos, conexiones }: { nodos: Nodo[]; conexiones: Conexion[] }) {
  const cuenta = (t: string) => nodos.filter((n) => n.data.tipo === t).length
  const usados = ORDEN_TIPOS.filter((t) => cuenta(t) > 0)
  const conexUsadas = (Object.keys(CONEXIONES) as TipoConexion[]).filter((t) => conexiones.some((c) => (c.data?.tipo ?? 'normal') === t))
  if (usados.length === 0) return null

  return (
    <div>
      <div className="leyenda-titulo">Leyenda</div>
      <div className="leyenda-items">
        {usados.map((t) => (
          <span key={t} className="leyenda-item">
            <span className={`muestra-caja t-${t}`} />
            {TIPOS[t].nombre.toLowerCase()}
            <span className="contador">{cuenta(t)}</span>
          </span>
        ))}
        {conexUsadas.map((t) => (
          <span key={t} className="leyenda-item">
            <svg width="26" height="8" className={`a-${t}`}>
              <line x1="0" y1="4" x2="26" y2="4" className="linea" />
            </svg>
            {CONEXIONES[t].toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  )
}
