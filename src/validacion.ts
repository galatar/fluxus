import { sinValor, variablesDe, variablesUsadas } from './dominio'
import type { Conexion, Nodo } from './tipos'

export interface Problema {
  nivel: 'error' | 'aviso'
  texto: string
  nodo?: string
  conexion?: string
}

/** Revisa el esquema y devuelve lo que falta o no encaja, errores primero. */
export function revisar(nodos: Nodo[], conexiones: Conexion[]): Problema[] {
  const pasos = nodos.filter((n) => n.data.tipo !== 'grupo')
  if (pasos.length === 0) return []
  const p: Problema[] = []
  const titulo = (id: string) => nodos.find((n) => n.id === id)?.data.titulo ?? '?'
  const variables = variablesDe(nodos)
  const claves = new Set(variables.map((v) => v.clave))

  const inicios = pasos.filter((n) => n.data.tipo === 'inicio')
  if (inicios.length === 0) p.push({ nivel: 'error', texto: 'Falta un inicio: no se sabe dónde arranca el procedimiento.' })
  if (!pasos.some((n) => n.data.tipo === 'fin')) p.push({ nivel: 'aviso', texto: 'No hay ningún fin.' })

  // Qué cajas se alcanzan siguiendo las flechas desde algún inicio.
  const alcanzadas = new Set(inicios.map((n) => n.id))
  const pendientes = [...alcanzadas]
  while (pendientes.length) {
    const id = pendientes.pop()!
    for (const c of conexiones) {
      if (c.source === id && !alcanzadas.has(c.target)) {
        alcanzadas.add(c.target)
        pendientes.push(c.target)
      }
    }
  }

  for (const n of pasos) {
    const { tipo, titulo: t } = n.data
    const entradas = conexiones.filter((c) => c.target === n.id)
    const salidas = conexiones.filter((c) => c.source === n.id)
    const de = (texto: string, nivel: Problema['nivel'] = 'aviso') => p.push({ nivel, texto: `${t}: ${texto}`, nodo: n.id })

    if (entradas.length + salidas.length === 0) {
      de('está suelta, sin ninguna flecha.')
      continue
    }
    if (tipo !== 'fin' && salidas.length === 0) de('no tiene salida; el procedimiento se queda aquí.', 'error')
    if (tipo === 'fin' && salidas.length > 0) de('es un fin, pero tiene flechas de salida.')
    if (tipo !== 'inicio' && entradas.length === 0) de('no llega ninguna flecha.')
    else if (inicios.length > 0 && !alcanzadas.has(n.id)) de('no se llega desde el inicio.')

    if (tipo === 'decision') {
      if (salidas.length < 2) de('una decisión necesita al menos dos salidas.', 'error')
      const porDefecto = salidas.filter((s) => s.data?.porDefecto)
      if (porDefecto.length > 1) de('tiene más de una salida «en cualquier otro caso».', 'error')
      for (const s of salidas) {
        const c = s.data?.condicion
        const hacia = `${t} → ${titulo(s.target)}`
        if (s.data?.porDefecto) continue
        if (!c?.campo) {
          if (salidas.length > 1) p.push({ nivel: 'aviso', texto: `${hacia}: la salida no tiene condición.`, conexion: s.id })
        } else if (!claves.has(c.campo)) {
          p.push({ nivel: 'error', texto: `${hacia}: la condición usa «${c.campo}», que ya no existe.`, conexion: s.id })
        } else if (!sinValor(c.operador) && !c.valor) {
          p.push({ nivel: 'aviso', texto: `${hacia}: a la condición le falta el valor.`, conexion: s.id })
        }
      }
    }

    if (tipo === 'formulario' && !n.data.campos?.length) de('el formulario no tiene campos.')
    if (tipo === 'aportado' && !n.data.requisitos?.length) de('no dice qué documentos se piden.')
    if (tipo === 'documento') {
      const cuerpo = n.data.plantilla?.cuerpo ?? ''
      if (!cuerpo.trim()) de('la plantilla está vacía.')
      const desconocidas = variablesUsadas(cuerpo + (n.data.plantilla?.nombreFichero ?? '')).filter((v) => !claves.has(v))
      for (const v of desconocidas) de(`la plantilla usa {{${v}}}, que no existe.`, 'error')
    }
  }

  // Una misma clave en dos sitios hace ambiguas plantillas y condiciones.
  const origenes = new Map<string, string[]>()
  for (const v of variables) origenes.set(v.clave, [...(origenes.get(v.clave) ?? []), v.origen])
  for (const [clave, donde] of origenes) {
    if (donde.length > 1) p.push({ nivel: 'error', texto: `La clave «${clave}» está repetida (${donde.join(', ')}).` })
  }

  return p.sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === 'error' ? -1 : 1))
}
