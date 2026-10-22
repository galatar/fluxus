import { OPERADORES, opcionesDe, sinValor, type Variable } from '../dominio'
import type { ConexionData, Operador } from '../tipos'

interface Props {
  data: ConexionData | undefined
  variables: Variable[]
  onCambio: (c: Partial<ConexionData>) => void
}

/** Condición de una salida de decisión: «Sentido del informe es Favorable». */
export function EditorCondicion({ data, variables, onCambio }: Props) {
  const c = data?.condicion ?? { campo: '', operador: 'igual' as Operador }
  const variable = variables.find((v) => v.clave === c.campo)
  const opciones = opcionesDe(variable?.campo)
  const porOrigen = Map.groupBy(variables, (v) => v.origen)

  return (
    <div className="condicion">
      <label className="casilla">
        <input type="checkbox" checked={!!data?.porDefecto} onChange={(e) => onCambio({ porDefecto: e.target.checked })} />
        En cualquier otro caso
      </label>
      {!data?.porDefecto && (
        <>
          <select value={c.campo} onChange={(e) => onCambio({ condicion: { ...c, campo: e.target.value, valor: '' } })}>
            <option value="">Elige un dato…</option>
            {[...porOrigen].map(([origen, vars]) => (
              <optgroup key={origen} label={origen}>
                {vars.map((v) => (
                  <option key={v.clave} value={v.clave}>
                    {v.etiqueta}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {c.campo && (
            <div className="tarjeta-fila">
              <select value={c.operador} onChange={(e) => onCambio({ condicion: { ...c, operador: e.target.value as Operador } })}>
                {Object.entries(OPERADORES).map(([v, n]) => (
                  <option key={v} value={v}>
                    {n}
                  </option>
                ))}
              </select>
              {!sinValor(c.operador) &&
                (opciones.length > 0 ? (
                  <select className="crece" value={c.valor ?? ''} onChange={(e) => onCambio({ condicion: { ...c, valor: e.target.value } })}>
                    <option value="">…</option>
                    {opciones.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input className="crece" value={c.valor ?? ''} placeholder="valor" onChange={(e) => onCambio({ condicion: { ...c, valor: e.target.value } })} />
                ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
