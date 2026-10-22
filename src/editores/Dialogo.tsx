import { useEffect, type ReactNode } from 'react'

interface Props {
  antetitulo: string
  titulo: string
  onCerrar: () => void
  children: ReactNode
}

/** Ventana grande para editar el contenido de una caja. Los cambios se guardan al momento. */
export function Dialogo({ antetitulo, titulo, onCerrar, children }: Props) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    addEventListener('keydown', tecla)
    return () => removeEventListener('keydown', tecla)
  }, [onCerrar])

  return (
    <div className="velo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="dialogo" role="dialog" aria-modal aria-label={titulo}>
        <header>
          <div>
            <div className="panel-titulo">{antetitulo}</div>
            <h2>{titulo}</h2>
          </div>
          <button className="boton primario" onClick={onCerrar}>
            Listo
          </button>
        </header>
        <div className="dialogo-cuerpo">{children}</div>
      </div>
    </div>
  )
}
