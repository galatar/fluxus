import { CircleAlert, CircleCheck, TriangleAlert, X } from 'lucide-react'
import type { Problema } from '../validacion'

interface Props {
  problemas: Problema[]
  onIr: (p: Problema) => void
  onCerrar: () => void
}

export function Revision({ problemas, onIr, onCerrar }: Props) {
  const errores = problemas.filter((p) => p.nivel === 'error').length
  const avisos = problemas.length - errores

  return (
    <>
      <div className="revision-cabecera">
        <div className="panel-titulo">Revisión</div>
        <button className="cerrar" onClick={onCerrar} aria-label="Cerrar revisión">
          <X size={14} />
        </button>
      </div>
      {problemas.length === 0 ? (
        <p className="todo-bien">
          <CircleCheck size={15} /> Todo en orden: no encuentro nada que falte.
        </p>
      ) : (
        <>
          <p className="ayuda">
            {errores} error{errores === 1 ? '' : 'es'} · {avisos} aviso{avisos === 1 ? '' : 's'}. Haz clic en uno para ir a la caja.
          </p>
          <ul className="problemas">
            {problemas.map((p, i) => (
              <li key={i}>
                <button className={p.nivel} onClick={() => onIr(p)} disabled={!p.nodo && !p.conexion}>
                  {p.nivel === 'error' ? <CircleAlert size={14} /> : <TriangleAlert size={14} />}
                  <span>{p.texto}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
