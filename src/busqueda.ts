import type { Campo, DocRequerido, Nodo } from './tipos'

export type Resultado =
  | { clase: 'caja'; nodo: Nodo }
  | { clase: 'campo'; nodo: Nodo; campo: Campo }
  | { clase: 'documento'; nodo: Nodo; doc: DocRequerido }

/** Sin mayúsculas ni tildes: «Revisión» y «revision» son lo mismo al buscar. */
export const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Todas las palabras de la consulta tienen que aparecer, en cualquier orden. */
function coincide(consulta: string[], ...textos: (string | undefined)[]) {
  const pajar = normalizar(textos.filter(Boolean).join(' '))
  return consulta.every((palabra) => pajar.includes(palabra))
}

/**
 * Cajas (por título, detalle y notas), campos de formulario (por pregunta, clave, ayuda y opciones)
 * y documentos que hay que aportar (por nombre e indicaciones).
 */
export function buscar(nodos: Nodo[], consulta: string): Resultado[] {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return []

  const cajas: Resultado[] = nodos
    .filter((n) => coincide(palabras, n.data.titulo, n.data.detalle, n.data.notas))
    .map((nodo) => ({ clase: 'caja', nodo }))
  const campos: Resultado[] = nodos.flatMap((nodo) =>
    (nodo.data.campos ?? [])
      .filter((c) => coincide(palabras, c.etiqueta, c.clave, c.ayuda, c.opciones))
      .map((campo): Resultado => ({ clase: 'campo', nodo, campo })),
  )
  const docs: Resultado[] = nodos.flatMap((nodo) =>
    (nodo.data.requisitos ?? [])
      .filter((d) => coincide(palabras, d.nombre, d.notas))
      .map((doc): Resultado => ({ clase: 'documento', nodo, doc })),
  )
  return [...cajas, ...campos, ...docs]
}
