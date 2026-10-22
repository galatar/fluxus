import type { Campo, Conexion, Esquema, Nodo, TipoConexion } from './tipos'

const CLAVE = 'flujus:esquemas'

/** La parrilla coincide con los puntos del fondo. */
export const PARRILLA = 20
export const aParrilla = (v: number) => Math.round(v / PARRILLA) * PARRILLA

/**
 * v1 guardaba la esquina superior izquierda de cada caja; v2 guarda su centro,
 * así dos cajas de distinta altura en la misma fila quedan a la misma altura
 * y la flecha sale recta.
 */
const VERSION = 2

function migrar(e: Esquema): Esquema {
  const v1 = (e.version ?? 1) < 2
  const nodes = e.nodes.map((n) => {
    let { x, y } = n.position
    if (v1) {
      const [ancho, alto] = n.data.tipo === 'inicio' ? [130, 52] : [220, 74]
      x += ancho / 2
      y += alto / 2
    }
    // Siempre a la parrilla: arregla también centros que quedaron descuadrados
    // con el snapToGrid de React Flow (ajustaba la esquina, no el centro).
    return { ...n, position: { x: aParrilla(x), y: aParrilla(y) } }
  })
  return { ...e, nodes, version: VERSION }
}

export const nuevoId = () => crypto.randomUUID()

const ahora = () => new Date().toISOString()

export function cargarEsquemas(): Esquema[] {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (crudo) return (JSON.parse(crudo) as Esquema[]).map(migrar)
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
  return { id: nuevoId(), version: VERSION, nombre, descripcion: '', creado: ahora(), actualizado: ahora(), nodes: [], edges: [] }
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
  return migrar({ ...datos, id: nuevoId(), actualizado: ahora() })
}

// --- Ejemplo inicial -------------------------------------------------------

function n(id: string, tipo: Nodo['data']['tipo'], x: number, y: number, titulo: string, detalle: string, extra: Partial<Nodo['data']> = {}): Nodo {
  return { id, type: 'nodo', position: { x, y }, data: { tipo, titulo, detalle, ...extra } }
}

function e(source: string, sh: string, target: string, th: string, tipo: TipoConexion, etiqueta?: string): Conexion {
  return { id: `${source}-${target}`, type: 'conexion', source, sourceHandle: sh, target, targetHandle: th, data: { tipo, etiqueta } }
}

function campo(clave: string, etiqueta: string, tipo: Campo['tipo'], obligatorio = true, opciones?: string): Campo {
  return { id: clave, clave, etiqueta, tipo, obligatorio, opciones }
}

const RESOLUCION = `RESOLUCIÓN DE LA GERENCIA

Expediente: {{numero_expediente}}
Fecha: {{fecha_actual}}

Vista la solicitud presentada por {{nombre_completo}}, con DNI {{dni}}, que ocupa el puesto de {{puesto}}, y el informe favorable del responsable del servicio,

RESUELVO

Autorizar la prestación de servicios en la modalidad de teletrabajo durante {{dias_teletrabajo}} a la semana, a partir del {{fecha_inicio}}.`

const DENEGACION = `RESOLUCIÓN DE LA GERENCIA

Expediente: {{numero_expediente}}

Vista la solicitud presentada por {{nombre_completo}} y el informe del responsable del servicio, que indica:

{{observaciones}}

RESUELVO

Denegar la solicitud de teletrabajo.`

export function esquemaEjemplo(): Esquema {
  const nodos = [
    n('n1', 'inicio', 60, 40, 'Inicio', 'persona solicitante'),
    n('n2', 'formulario', 300, 40, 'Solicitud', 'datos + horario propuesto', {
      campos: [
        campo('nombre_completo', 'Nombre y apellidos', 'texto'),
        campo('dni', 'DNI', 'dni'),
        campo('puesto', 'Puesto de trabajo', 'texto'),
        campo('dias_teletrabajo', 'Días de teletrabajo', 'lista', true, '1 día\n2 días\n3 días'),
        campo('fecha_inicio', 'Fecha de inicio', 'fecha'),
        campo('horario_propuesto', 'Horario propuesto', 'parrafo', false),
      ],
    }),
    n('n3', 'aportado', 600, 40, 'Plan de trabajo', 'firmado por la persona', {
      requisitos: [
        { id: 'd1', nombre: 'Plan de trabajo', obligatorio: true, formato: 'pdf', firmado: true },
        { id: 'd2', nombre: 'Autoevaluación del puesto', obligatorio: false, formato: 'pdf', firmado: false, notas: 'modelo de la web del PTGAS' },
      ],
    }),
    n('n4', 'decision', 900, 40, '¿Completa?', 'revisa la unidad'),
    n('n5', 'paso', 1200, 40, 'Informe', 'responsable del servicio', {
      campos: [
        campo('sentido_informe', 'Sentido del informe', 'lista', true, 'Favorable\nDesfavorable'),
        campo('observaciones', 'Observaciones', 'parrafo', false),
      ],
    }),
    n('n6', 'espera', 900, 260, 'Subsanación', '10 días hábiles'),
    n('n7', 'decision', 1200, 260, '¿Favorable?', 'valora el informe'),
    n('n8', 'documento', 1500, 260, 'Resolución', 'plantilla: concesión', {
      plantilla: { formato: 'pdf', nombreFichero: '{{numero_expediente}}-concesion', cuerpo: RESOLUCION },
    }),
    n('n9', 'notificacion', 1500, 480, 'Notificar', 'persona interesada'),
    n('n10', 'fin', 1500, 700, 'Concedido', 'alta en teletrabajo', { resultado: 'ok' }),
    n('n11', 'documento', 1200, 480, 'Denegación', 'plantilla: denegatoria', {
      plantilla: { formato: 'pdf', nombreFichero: '{{numero_expediente}}-denegacion', cuerpo: DENEGACION },
    }),
    n('n12', 'fin', 900, 480, 'Denegado', 'fin del procedimiento', { resultado: 'ko' }),
  ]
  const si = e('n7', 'right', 'n8', 'left', 'normal', 'sí')
  si.data!.condicion = { campo: 'sentido_informe', operador: 'igual', valor: 'Favorable' }
  const no = e('n7', 'bottom', 'n11', 'top', 'error', 'no')
  no.data!.porDefecto = true

  return {
    ...esquemaVacio('Solicitud de teletrabajo'),
    descripcion: 'Ejemplo: una persona del PTGAS pide teletrabajo y la unidad lo resuelve.',
    nodes: nodos,
    edges: [
      e('n1', 'right', 'n2', 'left', 'normal'),
      e('n2', 'right', 'n3', 'left', 'normal', 'enviar'),
      e('n3', 'right', 'n4', 'left', 'normal'),
      e('n4', 'right', 'n5', 'left', 'normal', 'sí'),
      e('n4', 'bottom', 'n6', 'top', 'alternativa', 'no'),
      e('n6', 'left', 'n3', 'bottom', 'alternativa', 'subsana'),
      e('n6', 'bottom', 'n12', 'top', 'error', 'no subsana'),
      e('n5', 'bottom', 'n7', 'top', 'normal'),
      si,
      e('n8', 'bottom', 'n9', 'top', 'normal'),
      e('n9', 'bottom', 'n10', 'top', 'normal'),
      no,
      e('n11', 'left', 'n12', 'right', 'error'),
    ],
  }
}
