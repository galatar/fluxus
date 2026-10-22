import {
  Bell,
  CircleDot,
  ClipboardList,
  FileText,
  Flag,
  GitBranch,
  Hourglass,
  Server,
  SquareDashed,
  Upload,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import type { Tipo, TipoConexion } from './tipos'

export interface DefTipo {
  nombre: string
  ayuda: string
  icono: LucideIcon
  tituloInicial: string
}

/** Orden en que aparecen en la paleta y en la leyenda. */
export const TIPOS: Record<Tipo, DefTipo> = {
  inicio: { nombre: 'Inicio', ayuda: 'Dónde arranca el procedimiento', icono: CircleDot, tituloInicial: 'Inicio' },
  paso: { nombre: 'Tarea', ayuda: 'Algo que hace una persona', icono: UserRound, tituloInicial: 'Nueva tarea' },
  formulario: { nombre: 'Formulario', ayuda: 'Pantalla donde alguien rellena datos', icono: ClipboardList, tituloInicial: 'Formulario' },
  aportado: { nombre: 'Doc. aportado', ayuda: 'Documento que sube la persona usuaria', icono: Upload, tituloInicial: 'Documento aportado' },
  documento: { nombre: 'Doc. generado', ayuda: 'Documento que crea la app con una plantilla', icono: FileText, tituloInicial: 'Documento generado' },
  decision: { nombre: 'Decisión', ayuda: 'Pregunta con varias salidas', icono: GitBranch, tituloInicial: '¿Condición?' },
  espera: { nombre: 'Espera', ayuda: 'Plazo o espera a un tercero', icono: Hourglass, tituloInicial: 'Plazo' },
  notificacion: { nombre: 'Aviso', ayuda: 'Correo o notificación', icono: Bell, tituloInicial: 'Notificar' },
  sistema: { nombre: 'Sistema', ayuda: 'Otra aplicación (Sirhus, Portafirmas…)', icono: Server, tituloInicial: 'Sistema externo' },
  fin: { nombre: 'Fin', ayuda: 'Final del procedimiento', icono: Flag, tituloInicial: 'Fin' },
  grupo: { nombre: 'Grupo', ayuda: 'Marco que agrupa varias cajas; al moverlo se llevan dentro', icono: SquareDashed, tituloInicial: 'Grupo' },
}

export const ORDEN_TIPOS = Object.keys(TIPOS) as Tipo[]

/** Tipos que son pasos del procedimiento (todo menos los marcos). */
export const TIPOS_PASO = ORDEN_TIPOS.filter((t) => t !== 'grupo')

export const CONEXIONES: Record<TipoConexion, string> = {
  normal: 'Camino normal',
  alternativa: 'Alternativa',
  error: 'Rechazo / error',
}
