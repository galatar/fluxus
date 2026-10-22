import { Handle, Position, type NodeProps } from '@xyflow/react'
import { TIPOS } from '../catalogo'
import { resumenNodo } from '../dominio'
import type { Nodo } from '../tipos'

const LADOS = [
  ['top', Position.Top],
  ['right', Position.Right],
  ['bottom', Position.Bottom],
  ['left', Position.Left],
] as const

export function NodoFlujo({ data, selected }: NodeProps<Nodo>) {
  const Icono = TIPOS[data.tipo].icono
  const resumen = resumenNodo(data)
  const clases = ['nodo', `t-${data.tipo}`]
  if (data.tipo === 'fin') clases.push(`fin-${data.resultado ?? 'ok'}`)
  if (selected) clases.push('seleccionado')

  return (
    <div className={clases.join(' ')}>
      <Icono className="nodo-icono" size={13} strokeWidth={2} />
      <div className="nodo-titulo">{data.titulo}</div>
      {data.detalle && <div className="nodo-detalle">{data.detalle}</div>}
      {resumen && <div className="nodo-resumen">{resumen}</div>}
      {LADOS.map(([id, pos]) => (
        <Handle key={id} id={id} type="source" position={pos} className="asa" />
      ))}
    </div>
  )
}
