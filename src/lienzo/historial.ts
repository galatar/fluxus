import { useCallback, useRef, useState } from 'react'

/** Pasos que se pueden deshacer como máximo. */
const LIMITE = 100

/**
 * Deshacer y rehacer sobre fotos del esquema (en JSON). Se anota una foto
 * cada vez que el esquema deja de cambiar (lo marca el autoguardado), así que
 * un arrastre entero cuenta como un solo paso y la selección no cuenta.
 */
export function useHistorial(inicial: string, aplicar: (foto: string) => void) {
  const pasado = useRef<string[]>([])
  const futuro = useRef<string[]>([])
  const actual = useRef(inicial)
  const [cuenta, setCuenta] = useState({ atras: 0, adelante: 0 })
  const refrescar = () => setCuenta({ atras: pasado.current.length, adelante: futuro.current.length })

  const anotar = useCallback((foto: string) => {
    if (foto === actual.current) return
    pasado.current.push(actual.current)
    if (pasado.current.length > LIMITE) pasado.current.shift()
    futuro.current = []
    actual.current = foto
    refrescar()
  }, [])

  // `ahora` es el estado de este momento: puede llevar cambios que aún no se
  // habían anotado (el autoguardado espera un poco) y hay que anotarlos antes.
  const deshacer = useCallback(
    (ahora: string) => {
      anotar(ahora)
      const previa = pasado.current.pop()
      if (previa === undefined) return
      futuro.current.push(actual.current)
      actual.current = previa
      refrescar()
      aplicar(previa)
    },
    [anotar, aplicar],
  )

  const rehacer = useCallback(
    (ahora: string) => {
      anotar(ahora)
      const siguiente = futuro.current.pop()
      if (siguiente === undefined) return
      pasado.current.push(actual.current)
      actual.current = siguiente
      refrescar()
      aplicar(siguiente)
    },
    [anotar, aplicar],
  )

  return { anotar, deshacer, rehacer, puedeDeshacer: cuenta.atras > 0, puedeRehacer: cuenta.adelante > 0 }
}
