import type { Conexion, Esquema, Nodo, TipoConexion } from './tipos'

const CLAVE = 'flujus:esquemas'

export const nuevoId = () => crypto.randomUUID()

const ahora = () => new Date().toISOString()

export function cargarEsquemas(): Esquema[] {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (crudo) return JSON.parse(crudo) as Esquema[]
  } catch {
    // Datos corruptos o almacenamiento bloqueado: empezamos con el ejemplo.
  }
  return [esquemaEjemplo()]
}

export function guardarEsquemas(esquemas: Esquema[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(esquemas))
  } catch (e) {
    console.error('No se pudo guardar', e)
  }
}

export function esquemaVacio(nombre = 'Nuevo esquema'): Esquema {
  return { id: nuevoId(), nombre, descripcion: '', creado: ahora(), actualizado: ahora(), nodes: [], edges: [] }
}

/** Quita el estado de interfaz (selección, medidas) antes de guardar. */
export function limpiar(nodes: Nodo[], edges: Conexion[]) {
  return {
    nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
    edges: edges.map(({ id, source, target, sourceHandle, targetHandle, type, data }) => ({
      id, source, target, sourceHandle, targetHandle, type, data,
    })),
  }
}

export function exportar(esquema: Esquema) {
  const blob = new Blob([JSON.stringify(esquema, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${esquema.nombre.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.flujus.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

export async function importar(fichero: File): Promise<Esquema> {
  const datos = JSON.parse(await fichero.text()) as Esquema
  if (!Array.isArray(datos.nodes) || !Array.isArray(datos.edges)) throw new Error('El fichero no es un esquema de Flujus')
  return { ...datos, id: nuevoId(), actualizado: ahora() }
}

// --- Ejemplo inicial -------------------------------------------------------

function n(id: string, tipo: Nodo['data']['tipo'], x: number, y: number, titulo: string, detalle: string, extra: Partial<Nodo['data']> = {}): Nodo {
  return { id, type: 'nodo', position: { x, y }, data: { tipo, titulo, detalle, ...extra } }
}

function e(source: string, sh: string, target: string, th: string, tipo: TipoConexion, etiqueta?: string): Conexion {
  return { id: `${source}-${target}`, type: 'conexion', source, sourceHandle: sh, target, targetHandle: th, data: { tipo, etiqueta } }
}

function esquemaEjemplo(): Esquema {
  return {
    ...esquemaVacio('Solicitud de teletrabajo'),
    descripcion: 'Ejemplo: una persona del PTGAS pide teletrabajo y la unidad lo resuelve.',
    nodes: [
      n('n1', 'inicio', 0, 11, 'Inicio', 'persona solicitante'),
      n('n2', 'formulario', 180, 0, 'Solicitud', 'datos + horario propuesto'),
      n('n3', 'aportado', 480, 0, 'Plan de trabajo', 'firmado por la persona'),
      n('n4', 'decision', 780, 0, '¿Completa?', 'revisa la unidad'),
      n('n5', 'paso', 1080, 0, 'Informe', 'responsable del servicio'),
      n('n6', 'espera', 780, 220, 'Subsanación', '10 días hábiles'),
      n('n7', 'decision', 1080, 220, '¿Favorable?', 'valora el informe'),
      n('n8', 'documento', 1380, 220, 'Resolución', 'plantilla: concesión'),
      n('n9', 'notificacion', 1380, 440, 'Notificar', 'persona interesada'),
      n('n10', 'fin', 1380, 660, 'Concedido', 'alta en teletrabajo', { resultado: 'ok' }),
      n('n11', 'documento', 1080, 440, 'Denegación', 'plantilla: denegatoria'),
      n('n12', 'fin', 780, 440, 'Denegado', 'fin del procedimiento', { resultado: 'ko' }),
    ],
    edges: [
      e('n1', 'right', 'n2', 'left', 'normal'),
      e('n2', 'right', 'n3', 'left', 'normal', 'enviar'),
      e('n3', 'right', 'n4', 'left', 'normal'),
      e('n4', 'right', 'n5', 'left', 'normal', 'sí'),
      e('n4', 'bottom', 'n6', 'top', 'alternativa', 'no'),
      e('n6', 'left', 'n3', 'bottom', 'alternativa', 'subsana'),
      e('n6', 'bottom', 'n12', 'top', 'error', 'no subsana'),
      e('n5', 'bottom', 'n7', 'top', 'normal'),
      e('n7', 'right', 'n8', 'left', 'normal', 'sí'),
      e('n8', 'bottom', 'n9', 'top', 'normal'),
      e('n9', 'bottom', 'n10', 'top', 'normal'),
      e('n7', 'bottom', 'n11', 'top', 'error', 'no'),
      e('n11', 'left', 'n12', 'right', 'error'),
    ],
  }
}
