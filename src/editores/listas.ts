/** Mover un elemento de una lista hacia arriba o hacia abajo. */
export function mover<T>(lista: T[], i: number, delta: number) {
  const j = i + delta
  if (j < 0 || j >= lista.length) return lista
  const copia = [...lista]
  ;[copia[i], copia[j]] = [copia[j], copia[i]]
  return copia
}
