import { useEffect, useRef, useState } from 'react'
import { esquemaEjemplo } from '../almacen'
import type { Esquema } from '../tipos'
import { borrarDeLaNube, cargarDeLaNube, guardarEnLaNube } from './esquemas'

export type EstadoGuardado = 'cargando' | 'guardado' | 'guardando' | 'error'

const ESPERA = 800

/**
 * Sustituye al useState + localStorage de la versión local. Carga los esquemas
 * de la persona y, cada vez que la lista cambia, sube solo los que han cambiado
 * (App sustituye el objeto de un esquema al editarlo, así que basta comparar
 * referencias) y borra los que ya no están. Agrupa los cambios durante 800 ms.
 */
export function useEsquemasNube(propietario: string) {
  const [esquemas, setEsquemas] = useState<Esquema[]>([])
  const [estado, setEstado] = useState<EstadoGuardado>('cargando')
  const subidos = useRef<Map<string, Esquema> | null>(null)
  const ocupado = useRef(false)

  useEffect(() => {
    let vivo = true
    cargarDeLaNube()
      .then((lista) => {
        if (!vivo) return
        // Persona nueva: empieza con el ejemplo (se subirá en la primera sincronización).
        const inicial = lista.length ? lista : [esquemaEjemplo()]
        subidos.current = new Map(lista.map((e) => [e.id, e]))
        setEsquemas(inicial)
        setEstado('guardado')
      })
      .catch((e) => {
        console.error('No se pudieron cargar los esquemas', e)
        if (vivo) setEstado('error')
      })
    return () => {
      vivo = false
    }
  }, [propietario])

  useEffect(() => {
    const previos = subidos.current
    if (!previos || ocupado.current) return
    const cambiados = esquemas.filter((e) => previos.get(e.id) !== e)
    const ids = new Set(esquemas.map((e) => e.id))
    const borrados = [...previos.keys()].filter((id) => !ids.has(id))
    if (!cambiados.length && !borrados.length) return

    setEstado('guardando')
    const t = setTimeout(async () => {
      ocupado.current = true
      let reintento = 0
      try {
        await guardarEnLaNube(propietario, cambiados)
        await borrarDeLaNube(borrados)
        for (const e of cambiados) previos.set(e.id, e)
        for (const id of borrados) previos.delete(id)
        setEstado('guardado')
      } catch (e) {
        console.error('No se pudo guardar', e)
        setEstado('error')
        reintento = 5000
      } finally {
        ocupado.current = false
        // Vuelve a comparar: recoge lo que cambió mientras se subía o reintenta tras un fallo.
        setTimeout(() => setEsquemas((es) => [...es]), reintento)
      }
    }, ESPERA)
    return () => clearTimeout(t)
  }, [esquemas, propietario])

  // Avisa al cerrar la pestaña si queda algo sin subir.
  useEffect(() => {
    if (estado !== 'guardando' && estado !== 'error') return
    const aviso = (ev: BeforeUnloadEvent) => ev.preventDefault()
    addEventListener('beforeunload', aviso)
    return () => removeEventListener('beforeunload', aviso)
  }, [estado])

  return { esquemas, setEsquemas, estado }
}
