import { migrar } from '../almacen'
import type { Esquema } from '../tipos'
import { supabase } from './cliente'

// Tabla `esquemas` (ver supabase/migrations): una fila por esquema, con el
// esquema entero en `datos`. Las reglas de la tabla (RLS) hacen que cada
// persona solo vea, cambie y borre los suyos.

interface Fila {
  id: string
  datos: Esquema
}

export async function cargarDeLaNube(): Promise<Esquema[]> {
  const { data, error } = await supabase.from('esquemas').select('id, datos').order('creado', { ascending: true })
  if (error) throw error
  return (data as Fila[]).map((f) => migrar({ ...f.datos, id: f.id }))
}

export async function guardarEnLaNube(propietario: string, esquemas: Esquema[]) {
  if (!esquemas.length) return
  const filas = esquemas.map((e) => ({ id: e.id, propietario, datos: e, creado: e.creado, actualizado: e.actualizado }))
  const { error } = await supabase.from('esquemas').upsert(filas)
  if (error) throw error
}

export async function borrarDeLaNube(ids: string[]) {
  if (!ids.length) return
  const { error } = await supabase.from('esquemas').delete().in('id', ids)
  if (error) throw error
}
