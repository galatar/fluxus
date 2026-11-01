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
  | 'grupo'

export type TipoCampo = 'texto' | 'parrafo' | 'numero' | 'fecha' | 'sino' | 'lista' | 'radio' | 'casilla' | 'email' | 'dni'

export interface Campo {
  id: string
  etiqueta: string
  /** Nombre técnico; es lo que se usa en plantillas ({{clave}}) y condiciones. */
  clave: string
  tipo: TipoCampo
  obligatorio: boolean
  /** Una opción por línea; para los tipos 'lista', 'radio' y 'casilla'. */
  opciones?: string
  ayuda?: string
}

export interface Plantilla {
  formato: 'pdf' | 'docx'
  nombreFichero: string
  cuerpo: string
}

export type FormatoDoc = 'pdf' | 'imagen' | 'word' | 'cualquiera'

export interface DocRequerido {
  id: string
  nombre: string
  obligatorio: boolean
  formato: FormatoDoc
  firmado: boolean
  notas?: string
}

export type NodoData = {
  tipo: Tipo
  titulo: string
  detalle?: string
  notas?: string
  /** Solo para nodos de fin: el procedimiento acaba bien o mal. */
  resultado?: 'ok' | 'ko'
  /** Formularios y tareas: datos que se rellenan en ese paso. */
  campos?: Campo[]
  /** Documentos generados. */
  plantilla?: Plantilla
  /** Documentos aportados por la persona usuaria. */
  requisitos?: DocRequerido[]
}

export type Nodo = Node<NodoData, 'nodo'>

export type TipoConexion = 'normal' | 'alternativa' | 'error'

export type Operador = 'igual' | 'distinto' | 'mayor' | 'menor' | 'contiene' | 'vacio' | 'relleno'

export interface Condicion {
  campo: string
  operador: Operador
  valor?: string
}

export type ConexionData = {
  tipo: TipoConexion
  etiqueta?: string
  /** Solo en salidas de una decisión. */
  condicion?: Condicion
  porDefecto?: boolean
  /** Cuánto se ha movido a mano el tramo central de la flecha (en px del lienzo). */
  desvio?: number
}

export type Conexion = Edge<ConexionData, 'conexion'>

/** Carril (fila, por actor) o fase (columna). Se apilan desde un origen. */
export interface Banda {
  id: string
  nombre: string
  /** Alto si es carril, ancho si es fase. */
  tamano: number
}

export interface Estructura {
  carriles: Banda[]
  /** y donde empieza el primer carril. */
  y0: number
  fases: Banda[]
  /** x donde empieza la primera fase. */
  x0: number
}

export interface Esquema {
  id: string
  /** Formato de guardado; ver migrar() en almacen.ts. */
  version?: number
  nombre: string
  descripcion: string
  creado: string
  actualizado: string
  nodes: Nodo[]
  edges: Conexion[]
  estructura?: Estructura
}
