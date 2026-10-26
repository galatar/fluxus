import { Plus } from 'lucide-react'
import { nuevoId } from '../almacen'
import { aClave, opcionesDe, TIPOS_CAMPO } from '../dominio'
import type { Campo, TipoCampo } from '../tipos'
import { BotonesFila } from './Filas'
import { mover } from './listas'

interface Props {
  titulo: string
  campos: Campo[]
  onCambio: (campos: Campo[]) => void
}

export function EditorCampos({ titulo, campos, onCambio }: Props) {
  const cambiar = (id: string, cambios: Partial<Campo>) => onCambio(campos.map((c) => (c.id === id ? { ...c, ...cambios } : c)))

  const renombrar = (c: Campo, etiqueta: string) => {
    // Si la clave seguía a la etiqueta, la arrastramos; si alguien la tocó a mano, la respetamos.
    const automatica = c.clave === aClave(c.etiqueta)
    cambiar(c.id, automatica ? { etiqueta, clave: aClave(etiqueta) } : { etiqueta })
  }

  const anadir = () => {
    const etiqueta = `Campo ${campos.length + 1}`
    onCambio([...campos, { id: nuevoId(), etiqueta, clave: aClave(etiqueta), tipo: 'texto', obligatorio: false }])
  }

  const repetidas = new Set(campos.map((c) => c.clave).filter((k, i, todas) => todas.indexOf(k) !== i))

  return (
    <div className="dos-columnas">
      <section>
        <div className="seccion-titulo">Campos</div>
        {campos.length === 0 && <p className="ayuda">Todavía no hay campos. Añade el primero.</p>}
        {campos.map((c, i) => (
          <div key={c.id} className="tarjeta">
            <div className="tarjeta-fila">
              <label className="crece">
                Pregunta
                <input value={c.etiqueta} onChange={(e) => renombrar(c, e.target.value)} />
              </label>
              <label>
                Tipo
                <select value={c.tipo} onChange={(e) => cambiar(c.id, { tipo: e.target.value as TipoCampo })}>
                  {Object.entries(TIPOS_CAMPO).map(([v, n]) => (
                    <option key={v} value={v}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <BotonesFila i={i} total={campos.length} onMover={(d) => onCambio(mover(campos, i, d))} onQuitar={() => onCambio(campos.filter((x) => x.id !== c.id))} />
            </div>
            {c.tipo === 'lista' && (
              <label>
                Opciones (una por línea)
                <textarea rows={3} value={c.opciones ?? ''} onChange={(e) => cambiar(c.id, { opciones: e.target.value })} />
              </label>
            )}
            <div className="tarjeta-fila">
              <label className="casilla">
                <input type="checkbox" checked={c.obligatorio} onChange={(e) => cambiar(c.id, { obligatorio: e.target.checked })} />
                Obligatorio
              </label>
              <label className="crece">
                Texto de ayuda
                <input value={c.ayuda ?? ''} placeholder="opcional" onChange={(e) => cambiar(c.id, { ayuda: e.target.value })} />
              </label>
              <label title="Nombre que se usa en plantillas y condiciones">
                Clave
                <input
                  className={`mono${repetidas.has(c.clave) ? ' error' : ''}`}
                  value={c.clave}
                  onChange={(e) => cambiar(c.id, { clave: aClave(e.target.value) })}
                />
              </label>
            </div>
          </div>
        ))}
        <button className="boton" onClick={anadir}>
          <Plus size={14} /> Añadir campo
        </button>
        {repetidas.size > 0 && <p className="aviso">Hay claves repetidas: cada campo necesita una distinta.</p>}
      </section>

      <section>
        <div className="seccion-titulo">Así lo verá la persona usuaria</div>
        <div className="vista-previa formulario-previa">
          <h3>{titulo}</h3>
          {campos.map((c) => (
            <div key={c.id} className="campo-previo">
              <span className="campo-etiqueta">
                {c.etiqueta}
                {c.obligatorio && <span className="obligatorio"> *</span>}
              </span>
              <Control campo={c} />
              {c.ayuda && <span className="campo-ayuda">{c.ayuda}</span>}
            </div>
          ))}
          {campos.length > 0 && <button className="boton primario falso">Enviar</button>}
        </div>
      </section>
    </div>
  )
}

function Control({ campo }: { campo: Campo }) {
  switch (campo.tipo) {
    case 'parrafo':
      return <textarea rows={3} />
    case 'lista':
      return (
        <select>
          <option>Elige una opción…</option>
          {opcionesDe(campo).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      )
    case 'sino':
      return (
        <div className="radios">
          <label>
            <input type="radio" name={campo.id} /> Sí
          </label>
          <label>
            <input type="radio" name={campo.id} /> No
          </label>
        </div>
      )
    case 'numero':
      return <input type="number" />
    case 'fecha':
      return <input type="date" />
    case 'email':
      return <input type="email" placeholder="nombre@us.es" />
    case 'dni':
      return <input placeholder="12345678Z" />
    default:
      return <input />
  }
}
