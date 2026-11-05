import type { Campo, Conexion, Esquema, Nodo, TipoConexion } from './tipos'

// El proyecto se llamaba «flujus»; al pasar a «fluxus» se renombran las claves
// de localStorage conservando los datos ya guardados en el navegador. Se copia
// una sola vez cada clave vieja a la nueva si esta no existe todavía.
for (const vieja of ['esquemas', 'orden', 'activo', 'tema', 'lateral']) {
  const nueva = `fluxus:${vieja}`
  const previo = localStorage.getItem(`flujus:${vieja}`)
  if (previo !== null && localStorage.getItem(nueva) === null) localStorage.setItem(nueva, previo)
}

const CLAVE = 'fluxus:esquemas'

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
const CLAVE_ORDEN = 'fluxus:orden'

export function cargarEsquemas(): Esquema[] {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (crudo) {
      const lista = (JSON.parse(crudo) as Esquema[]).map(migrar)
      // Antes los esquemas nuevos se ponían delante; ahora van detrás, así que
      // la lista guardada se da la vuelta una sola vez (y se guarda ya vuelta).
      if (!localStorage.getItem(CLAVE_ORDEN)) {
        lista.reverse()
        localStorage.setItem(CLAVE, JSON.stringify(lista))
        localStorage.setItem(CLAVE_ORDEN, 'antiguos-primero')
      }
      return lista
    }
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
  a.download = `${esquema.nombre.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.fluxus.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

export async function importar(fichero: File): Promise<Esquema> {
  const datos = JSON.parse(await fichero.text()) as Esquema
  if (!Array.isArray(datos.nodes) || !Array.isArray(datos.edges)) throw new Error('El fichero no es un esquema de Fluxus')
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

// --- Ejemplo: presupuesto de la unidad -------------------------------------

const INFORME_TRIMESTRAL = `INFORME DE ESTADO TRIMESTRAL

Unidad: {{unidad}} · Ejercicio: {{ejercicio}}
Emitido el: {{fecha_actual}}

Partidas del ejercicio con su saldo, lo gastado y el porcentaje ejecutado:
{{partidas}}

Cada partida va acompañada de su cuantía, gasto acumulado y saldo disponible.`

const INFORME_CIERRE = `CUENTA DE CIERRE DEL EJERCICIO

Unidad: {{unidad}} · Ejercicio: {{ejercicio}}
Emitido el: {{fecha_actual}}

Balance por partida del ejercicio:
{{partidas}}

Fondo de reserva no comprometido: {{fondo_reserva}}`

const PARTIDAS_EJEMPLO = 'Material de oficina\nReprografía\nMantenimiento\nViajes y dietas\nImprenta y publicaciones'

/**
 * App para preparar un presupuesto sencillo por partidas, registrar lo gastado
 * en cada una, controlar que no se supere la cuantía y emitir informes de
 * estado trimestrales y de cierre del ejercicio.
 */
export function esquemaPresupuesto(): Esquema {
  const nodos = [
    n('n1', 'inicio', 60, 290, 'Inicio', 'arranca la planificación del ejercicio'),
    n('n2', 'formulario', 280, 290, 'Crear presupuesto', 'partidas y cuantía del ejercicio', {
      campos: [
        campo('ejercicio', 'Ejercicio', 'numero'),
        campo('partidas', 'Partidas del presupuesto', 'parrafo', true, undefined),
        campo('fondo_reserva', 'Fondo de reserva', 'numero', false),
      ],
    }),
    n('n3', 'decision', 500, 290, '¿Aprobado?', 'lo revisa el responsable de la unidad'),
    n('n4', 'sistema', 720, 550, 'Registrar presupuesto', 'la app lo guarda y activa el seguimiento'),
    n('n5', 'formulario', 1020, 290, 'Registrar gasto', 'importe, partida y justificante', {
      campos: [
        campo('partida', 'Partida', 'lista', true, PARTIDAS_EJEMPLO),
        campo('importe', 'Importe', 'numero'),
        campo('concepto', 'Concepto', 'texto'),
        campo('proveedor', 'Proveedor', 'texto', false),
        campo('fecha_gasto', 'Fecha del gasto', 'fecha'),
      ],
    }),
    n('n6', 'sistema', 1020, 550, 'Verificar saldo', 'la app resta el importe de la partida'),
    n('n7', 'decision', 1260, 550, '¿Hay saldo suficiente?', 'compara el gasto con lo disponible en la partida'),
    n('n8', 'notificacion', 1260, 30, 'Aviso: partida sin fondos', 'avisa a la unidad de que se ha superado la cuantía'),
    n('n9', 'sistema', 1500, 550, 'Imputar gasto', 'anota el gasto y actualiza el saldo de la partida'),
    n('n10', 'decision', 2160, 290, '¿Fin de trimestre?', 'llegado el momento, se tiran los informes de estado'),
    n('n11', 'sistema', 2400, 550, 'Recopilar gastos del trimestre', 'la app agrupa lo gastado de cada partida'),
    n('n12', 'documento', 2600, 290, 'Informe de estado trimestral', 'plantilla: resumen del trimestre', {
      plantilla: { formato: 'pdf', nombreFichero: 'informe-trimestral-{{ejercicio}}', cuerpo: INFORME_TRIMESTRAL },
    }),
    n('n13', 'decision', 2600, 30, '¿Revisado?', 'lo valida el responsable de la unidad'),
    n('n14', 'notificacion', 2820, 30, 'Enviar a gerencia', 'se remite el informe trimestral'),
    n('n15', 'decision', 3000, 290, '¿Fin de ejercicio?', 'terminado el año, se prepara el cierre'),
    n('n16', 'sistema', 3200, 550, 'Acumular saldos', 'suma el gasto y calcula el remanente'),
    n('n17', 'documento', 3400, 290, 'Informe de cierre', 'plantilla: cuenta del ejercicio', {
      plantilla: { formato: 'pdf', nombreFichero: 'cierre-{{ejercicio}}', cuerpo: INFORME_CIERRE },
    }),
    n('n18', 'decision', 3400, 30, '¿Aprobado?', 'lo valida el responsable de la unidad'),
    n('n19', 'notificacion', 3620, 30, 'Enviar a gerencia', 'se remite la cuenta de cierre'),
    n('n20', 'fin', 3820, 290, 'Ejercicio cerrado', 'presupuesto liquidado', { resultado: 'ok' }),
  ]

  const aprobado = e('n3', 'right', 'n4', 'left', 'normal', 'sí')
  aprobado.data!.porDefecto = true
  const conSaldo = e('n7', 'right', 'n9', 'left', 'normal', 'sí')
  conSaldo.data!.porDefecto = true
  const trimestreSigue = e('n10', 'left', 'n5', 'right', 'alternativa', 'no')
  trimestreSigue.data!.porDefecto = true
  const trimestreTermina = e('n10', 'right', 'n11', 'left', 'normal', 'sí')
  const revisado = e('n13', 'right', 'n14', 'left', 'normal', 'sí')
  revisado.data!.porDefecto = true
  const nuevoTrimestre = e('n15', 'left', 'n10', 'top', 'alternativa', 'no · nuevo trimestre')
  nuevoTrimestre.data!.porDefecto = true
  const cierre = e('n15', 'right', 'n16', 'left', 'normal', 'sí')
  const cierreAprobado = e('n18', 'right', 'n19', 'left', 'normal', 'sí')
  cierreAprobado.data!.porDefecto = true

  return {
    ...esquemaVacio('Presupuesto de la unidad'),
    descripcion:
      'App para preparar un presupuesto por partidas, seguir lo que se gasta en cada una y emitir informes de estado trimestrales y de cierre del ejercicio.',
    nodes: nodos,
    estructura: {
      y0: -100,
      carriles: [
        { id: 'c1', nombre: 'Responsable de la unidad', tamano: 260 },
        { id: 'c2', nombre: 'Unidad de gestión', tamano: 260 },
        { id: 'c3', nombre: 'App de presupuesto', tamano: 260 },
      ],
      x0: -160,
      fases: [
        { id: 'f1', nombre: 'Configuración', tamano: 1020 },
        { id: 'f2', nombre: 'Seguimiento del gasto', tamano: 900 },
        { id: 'f3', nombre: 'Informes trimestrales', tamano: 1100 },
        { id: 'f4', nombre: 'Cierre del ejercicio', tamano: 900 },
      ],
    },
    edges: [
      e('n1', 'right', 'n2', 'left', 'normal'),
      e('n2', 'right', 'n3', 'left', 'normal', 'enviar a revisar'),
      e('n3', 'top', 'n2', 'bottom', 'alternativa', 'no'),
      aprobado,
      e('n4', 'right', 'n5', 'left', 'normal'),
      e('n5', 'bottom', 'n6', 'top', 'normal'),
      e('n6', 'right', 'n7', 'left', 'normal'),
      e('n7', 'top', 'n8', 'bottom', 'error', 'no hay saldo'),
      conSaldo,
      e('n8', 'left', 'n5', 'right', 'alternativa', 'revisar partida'),
      e('n9', 'right', 'n10', 'left', 'normal'),
      trimestreSigue,
      trimestreTermina,
      e('n11', 'right', 'n12', 'left', 'normal'),
      e('n12', 'top', 'n13', 'bottom', 'normal'),
      e('n13', 'bottom', 'n12', 'top', 'alternativa', 'no'),
      revisado,
      e('n14', 'right', 'n15', 'left', 'normal'),
      nuevoTrimestre,
      cierre,
      e('n16', 'right', 'n17', 'left', 'normal'),
      e('n17', 'top', 'n18', 'bottom', 'normal'),
      e('n18', 'bottom', 'n17', 'top', 'alternativa', 'no'),
      cierreAprobado,
      e('n19', 'right', 'n20', 'left', 'normal'),
    ],
  }
}
