import type { Campo, Condicion, FormatoDoc, Nodo, NodoData, Operador, Plantilla, Tipo, TipoCampo } from './tipos'

export const TIPOS_CAMPO: Record<TipoCampo, string> = {
  texto: 'Texto corto',
  parrafo: 'Texto largo',
  numero: 'Número',
  fecha: 'Fecha',
  sino: 'Sí / No',
  lista: 'Lista de opciones',
  email: 'Correo electrónico',
  dni: 'DNI / NIE',
}

export const FORMATOS_DOC: Record<FormatoDoc, string> = {
  pdf: 'PDF',
  imagen: 'Imagen (JPG, PNG)',
  word: 'Word',
  cualquiera: 'Cualquiera',
}

export const OPERADORES: Record<Operador, string> = {
  igual: 'es',
  distinto: 'no es',
  mayor: 'es mayor que',
  menor: 'es menor que',
  contiene: 'contiene',
  vacio: 'está vacío',
  relleno: 'está relleno',
}

export const sinValor = (op: Operador) => op === 'vacio' || op === 'relleno'

/** Tipos de caja que recogen datos. */
export const CON_CAMPOS: Tipo[] = ['formulario', 'paso']

export const PLANTILLA_VACIA: Plantilla = { formato: 'pdf', nombreFichero: '{{numero_expediente}}', cuerpo: '' }

/** «Horario propuesto» → «horario_propuesto». */
export function aClave(texto: string) {
  return (
    texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || 'campo'
  )
}

export const opcionesDe = (c?: Campo) =>
  c?.tipo === 'sino' ? ['Sí', 'No'] : (c?.opciones ?? '').split('\n').map((o) => o.trim()).filter(Boolean)

export interface Variable {
  clave: string
  etiqueta: string
  origen: string
  campo?: Campo
}

export const VARIABLES_SISTEMA: Variable[] = [
  { clave: 'fecha_actual', etiqueta: 'Fecha de hoy', origen: 'Sistema' },
  { clave: 'numero_expediente', etiqueta: 'Nº de expediente', origen: 'Sistema' },
  { clave: 'unidad', etiqueta: 'Unidad tramitadora', origen: 'Sistema' },
]

/** Todos los datos que se recogen en el esquema, más los que pone el sistema. */
export function variablesDe(nodos: Nodo[]): Variable[] {
  const deCampos = nodos.flatMap((n) =>
    (n.data.campos ?? []).map((c) => ({ clave: c.clave, etiqueta: c.etiqueta, origen: n.data.titulo, campo: c })),
  )
  return [...deCampos, ...VARIABLES_SISTEMA]
}

export const VARIABLE_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g

export function variablesUsadas(texto: string) {
  return [...new Set([...texto.matchAll(VARIABLE_RE)].map((m) => m[1]))]
}

export function textoCondicion(c: Condicion | undefined, variables: Variable[]) {
  if (!c?.campo) return ''
  const nombre = variables.find((v) => v.clave === c.campo)?.etiqueta ?? c.campo
  return sinValor(c.operador) ? `${nombre} ${OPERADORES[c.operador]}` : `${nombre} ${OPERADORES[c.operador]} ${c.valor ?? '…'}`
}

/** Línea pequeña bajo el detalle de la caja: cuánto contenido tiene. */
export function resumenNodo(d: NodoData) {
  const plural = (n: number, s: string) => `${n} ${s}${n === 1 ? '' : 's'}`
  if (CON_CAMPOS.includes(d.tipo) && d.campos?.length) return plural(d.campos.length, 'campo')
  if (d.tipo === 'aportado' && d.requisitos?.length) return plural(d.requisitos.length, 'documento')
  if (d.tipo === 'documento' && d.plantilla?.cuerpo) {
    return `${d.plantilla.formato.toUpperCase()} · ${plural(variablesUsadas(d.plantilla.cuerpo).length, 'variable')}`
  }
  return undefined
}
