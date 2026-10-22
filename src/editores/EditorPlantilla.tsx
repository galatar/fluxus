import { useRef, type ReactNode } from 'react'
import { VARIABLE_RE, type Variable } from '../dominio'
import type { Plantilla } from '../tipos'

interface Props {
  plantilla: Plantilla
  variables: Variable[]
  onCambio: (p: Plantilla) => void
}

export function EditorPlantilla({ plantilla, variables, onCambio }: Props) {
  const texto = useRef<HTMLTextAreaElement>(null)
  const cambiar = (c: Partial<Plantilla>) => onCambio({ ...plantilla, ...c })

  const insertar = (clave: string) => {
    const ta = texto.current!
    const ficha = `{{${clave}}}`
    const { selectionStart: a, selectionEnd: b } = ta
    cambiar({ cuerpo: plantilla.cuerpo.slice(0, a) + ficha + plantilla.cuerpo.slice(b) })
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(a + ficha.length, a + ficha.length)
    })
  }

  const porOrigen = Map.groupBy(variables, (v) => v.origen)

  return (
    <div className="dos-columnas">
      <section>
        <div className="tarjeta-fila">
          <label className="crece">
            Nombre del fichero
            <input className="mono" value={plantilla.nombreFichero} onChange={(e) => cambiar({ nombreFichero: e.target.value })} />
          </label>
          <label>
            Formato
            <select value={plantilla.formato} onChange={(e) => cambiar({ formato: e.target.value as Plantilla['formato'] })}>
              <option value="pdf">PDF</option>
              <option value="docx">Word</option>
            </select>
          </label>
        </div>
        <label>
          Texto del documento
          <textarea
            ref={texto}
            className="plantilla-texto"
            rows={16}
            value={plantilla.cuerpo}
            placeholder={'RESOLUCIÓN\n\nVista la solicitud presentada por {{nombre_completo}}…'}
            onChange={(e) => cambiar({ cuerpo: e.target.value })}
          />
        </label>
        <div className="seccion-titulo">Datos disponibles · clic para insertar</div>
        {variables.length === 0 && <p className="ayuda">Añade campos a algún formulario para poder usarlos aquí.</p>}
        {[...porOrigen].map(([origen, vars]) => (
          <div key={origen} className="grupo-fichas">
            <span className="grupo-nombre">{origen}</span>
            {vars.map((v) => (
              <button key={v.clave} className="ficha" onClick={() => insertar(v.clave)} title={`{{${v.clave}}}`}>
                {v.etiqueta}
              </button>
            ))}
          </div>
        ))}
      </section>

      <section>
        <div className="seccion-titulo">Vista previa · {rellenar(plantilla.nombreFichero, variables)}.{plantilla.formato}</div>
        <div className="vista-previa papel">
          {plantilla.cuerpo ? rellenar(plantilla.cuerpo, variables) : <span className="ayuda">El documento está vacío.</span>}
        </div>
      </section>
    </div>
  )
}

/** Sustituye {{clave}} por una marca con el nombre del dato; en rojo si no existe. */
function rellenar(texto: string, variables: Variable[]): ReactNode[] {
  const trozos: ReactNode[] = []
  let ultimo = 0
  for (const m of texto.matchAll(VARIABLE_RE)) {
    trozos.push(texto.slice(ultimo, m.index))
    const v = variables.find((x) => x.clave === m[1])
    trozos.push(
      <mark key={m.index} className={v ? 'variable' : 'variable desconocida'} title={v ? `{{${v.clave}}} · ${v.origen}` : 'Este dato no existe en el esquema'}>
        {v?.etiqueta ?? m[1]}
      </mark>,
    )
    ultimo = m.index + m[0].length
  }
  trozos.push(texto.slice(ultimo))
  return trozos
}
