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
    nodes: nodes.map(({ id, type, position, data, width, height, zIndex }) => ({ id, type, position, data, width, height, zIndex })),
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
    n('n1', 'inicio', 60, 120, 'Inicio', 'persona solicitante'),
    n('n2', 'formulario', 300, 120, 'Solicitud', 'datos + horario propuesto', {
      campos: [
        campo('nombre_completo', 'Nombre y apellidos', 'texto'),
        campo('dni', 'DNI', 'dni'),
        campo('puesto', 'Puesto de trabajo', 'texto'),
        campo('dias_teletrabajo', 'Días de teletrabajo', 'lista', true, '1 día\n2 días\n3 días'),
        campo('fecha_inicio', 'Fecha de inicio', 'fecha'),
        campo('horario_propuesto', 'Horario propuesto', 'parrafo', false),
      ],
    }),
    n('n3', 'aportado', 600, 120, 'Plan de trabajo', 'firmado por la persona', {
      requisitos: [
        { id: 'd1', nombre: 'Plan de trabajo', obligatorio: true, formato: 'pdf', firmado: true },
        { id: 'd2', nombre: 'Autoevaluación del puesto', obligatorio: false, formato: 'pdf', firmado: false, notas: 'modelo de la web del PTGAS' },
      ],
    }),
    n('n4', 'decision', 600, 360, '¿Completa?', 'revisa la unidad'),
    n('n5', 'paso', 900, 840, 'Informe', 'responsable del servicio', {
      campos: [
        campo('sentido_informe', 'Sentido del informe', 'lista', true, 'Favorable\nDesfavorable'),
        campo('observaciones', 'Observaciones', 'parrafo', false),
      ],
    }),
    n('n6', 'espera', 900, 120, 'Subsanación', '10 días hábiles'),
    n('n7', 'decision', 1200, 600, '¿Favorable?', 'valora el informe'),
    n('n8', 'documento', 1500, 600, 'Resolución', 'plantilla: concesión', {
      plantilla: { formato: 'pdf', nombreFichero: '{{numero_expediente}}-concesion', cuerpo: RESOLUCION },
    }),
    n('n9', 'notificacion', 1800, 600, 'Notificar', 'persona interesada'),
    n('n10', 'fin', 1800, 360, 'Concedido', 'alta en teletrabajo', { resultado: 'ok' }),
    n('n11', 'documento', 1200, 360, 'Denegación', 'plantilla: denegatoria', {
      plantilla: { formato: 'pdf', nombreFichero: '{{numero_expediente}}-denegacion', cuerpo: DENEGACION },
    }),
    n('n12', 'fin', 1500, 360, 'Denegado', 'fin del procedimiento', { resultado: 'ko' }),
    n('n13', 'fin', 1200, 120, 'Desiste', 'no subsana en plazo', { resultado: 'ko' }),
  ]
  const si = e('n7', 'right', 'n8', 'left', 'normal', 'sí')
  si.data!.condicion = { campo: 'sentido_informe', operador: 'igual', valor: 'Favorable' }
  const no = e('n7', 'top', 'n11', 'bottom', 'error', 'no')
  no.data!.porDefecto = true

  return {
    ...esquemaVacio('Solicitud de teletrabajo'),
    descripcion: 'Ejemplo: una persona del PTGAS pide teletrabajo y la unidad lo resuelve.',
    nodes: nodos,
    estructura: {
      y0: 0,
      carriles: [
        { id: 'c1', nombre: 'Persona solicitante', tamano: 240 },
        { id: 'c2', nombre: 'Unidad de RR. HH.', tamano: 480 },
        { id: 'c3', nombre: 'Responsable', tamano: 240 },
      ],
      x0: -60,
      fases: [
        { id: 'f1', nombre: 'Solicitud', tamano: 780 },
        { id: 'f2', nombre: 'Instrucción', tamano: 600 },
        { id: 'f3', nombre: 'Resolución', tamano: 660 },
      ],
    },
    edges: [
      e('n1', 'right', 'n2', 'left', 'normal'),
      e('n2', 'right', 'n3', 'left', 'normal', 'enviar'),
      e('n3', 'bottom', 'n4', 'top', 'normal'),
      e('n4', 'right', 'n6', 'bottom', 'alternativa', 'no'),
      e('n6', 'left', 'n3', 'right', 'alternativa', 'subsana'),
      e('n6', 'right', 'n13', 'left', 'error', 'no subsana'),
      e('n4', 'bottom', 'n5', 'left', 'normal', 'sí'),
      e('n5', 'right', 'n7', 'bottom', 'normal'),
      si,
      e('n8', 'right', 'n9', 'left', 'normal'),
      e('n9', 'top', 'n10', 'bottom', 'normal'),
      no,
      e('n11', 'right', 'n12', 'left', 'error'),
    ],
  }
}
