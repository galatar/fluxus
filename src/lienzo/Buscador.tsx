import { Search, TextCursorInput, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import type { Resultado } from '../busqueda'
import { TIPOS } from '../catalogo'

interface Props {
  consulta: string
  resultados: Resultado[]
  entrada: RefObject<HTMLInputElement | null>
  onConsulta: (c: string) => void
  onIr: (r: Resultado) => void
  onCerrar: () => void
}

export function Buscador({ consulta, resultados, entrada, onConsulta, onIr, onCerrar }: Props) {
  const [activo, setActivo] = useState(0)
  const lista = useRef<HTMLUListElement>(null)
  const actual = Math.min(activo, Math.max(resultados.length - 1, 0))

  useEffect(() => {
    entrada.current?.focus()
  }, [entrada])

  useEffect(() => {
    lista.current?.children[actual]?.scrollIntoView({ block: 'nearest' })
  }, [actual])

  const alPulsar = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCerrar()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (resultados.length) setActivo((actual + (e.key === 'ArrowDown' ? 1 : -1) + resultados.length) % resultados.length)
    } else if (e.key === 'Enter' && resultados[actual]) {
      onIr(resultados[actual])
    }
  }

  return (
    <>
      <div className="buscador-campo">
        <Search size={14} />
        <input
          ref={entrada}
          value={consulta}
          placeholder="Buscar cajas, campos o documentos"
          aria-label="Buscar"
          onChange={(e) => {
            onConsulta(e.target.value)
            setActivo(0)
          }}
          onKeyDown={alPulsar}
        />
        <button className="cerrar" onClick={onCerrar} aria-label="Cerrar búsqueda">
          <X size={14} />
        </button>
      </div>
      {consulta.trim() !== '' &&
        (resultados.length === 0 ? (
          <p className="ayuda buscador-vacio">No encuentro nada con «{consulta.trim()}».</p>
        ) : (
          <ul className="buscador-lista" ref={lista}>
            {resultados.map((r, i) => {
              const { tipo, titulo, detalle } = r.nodo.data
              const Icono = r.clase === 'caja' ? TIPOS[tipo].icono : r.clase === 'campo' ? TextCursorInput : Upload
              const clave = r.clase === 'caja' ? r.nodo.id : `${r.nodo.id}/${r.clase === 'campo' ? r.campo.id : r.doc.id}`
              return (
                <li key={clave}>
                  <button className={i === actual ? 'activo' : ''} onClick={() => onIr(r)} onMouseMove={() => setActivo(i)}>
                    <Icono size={14} style={{ color: `var(--c-${tipo})` }} />
                    <span className="buscador-texto">
                      <span className="buscador-titulo">{r.clase === 'caja' ? titulo : r.clase === 'campo' ? r.campo.etiqueta : r.doc.nombre}</span>
                      <span className="buscador-sub">
                        {r.clase === 'caja'
                          ? [TIPOS[tipo].nombre, detalle].filter(Boolean).join(' · ')
                          : r.clase === 'campo'
                            ? `Campo de «${titulo}» · ${r.campo.clave}`
                            : `Documento que se pide en «${titulo}»`}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ))}
    </>
  )
}
