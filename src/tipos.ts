import type { Edge, Node } from '@xyflow/react'

export type Tipo =
  | 'inicio'
  | 'paso'
  | 'formulario'
  | 'aportado'
  | 'documento'
  | 'decision'
  | 'espera'
  | 'notificacion'
  | 'sistema'
  | 'fin'

export type NodoData = {
  tipo: Tipo
  titulo: string
  detalle?: string
  notas?: string
  /** Solo para nodos de fin: el procedimiento acaba bien o mal. */
  resultado?: 'ok' | 'ko'
}

export type Nodo = Node<NodoData, 'nodo'>

export type TipoConexion = 'normal' | 'alternativa' | 'error'

export type ConexionData = {
  tipo: TipoConexion
  etiqueta?: string
}

export type Conexion = Edge<ConexionData, 'conexion'>

export interface Esquema {
  id: string
  nombre: string
  descripcion: string
  creado: string
  actualizado: string
  nodes: Nodo[]
  edges: Conexion[]
}
