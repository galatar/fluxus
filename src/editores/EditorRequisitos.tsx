import { FileUp, Plus } from 'lucide-react'
import { nuevoId } from '../almacen'
import { FORMATOS_DOC } from '../dominio'
import type { DocRequerido, FormatoDoc } from '../tipos'
import { BotonesFila, mover } from './Filas'

interface Props {
  titulo: string
  docs: DocRequerido[]
  onCambio: (docs: DocRequerido[]) => void
}

export function EditorRequisitos({ titulo, docs, onCambio }: Props) {
  const cambiar = (id: string, c: Partial<DocRequerido>) => onCambio(docs.map((d) => (d.id === id ? { ...d, ...c } : d)))
  const anadir = () => onCambio([...docs, { id: nuevoId(), nombre: 'Nuevo documento', obligatorio: true, formato: 'pdf', firmado: false }])

  return (
    <div className="dos-columnas">
      <section>
        <div className="seccion-titulo">Documentos que se piden</div>
        {docs.length === 0 && <p className="ayuda">Todavía no se pide ningún documento.</p>}
        {docs.map((d, i) => (
          <div key={d.id} className="tarjeta">
            <div className="tarjeta-fila">
              <label className="crece">
                Documento
                <input value={d.nombre} onChange={(e) => cambiar(d.id, { nombre: e.target.value })} />
              </label>
              <label>
                Formato
                <select value={d.formato} onChange={(e) => cambiar(d.id, { formato: e.target.value as FormatoDoc })}>
                  {Object.entries(FORMATOS_DOC).map(([v, n]) => (
                    <option key={v} value={v}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <BotonesFila i={i} total={docs.length} onMover={(x) => onCambio(mover(docs, i, x))} onQuitar={() => onCambio(docs.filter((x) => x.id !== d.id))} />
            </div>
            <div className="tarjeta-fila">
              <label className="casilla">
                <input type="checkbox" checked={d.obligatorio} onChange={(e) => cambiar(d.id, { obligatorio: e.target.checked })} />
                Obligatorio
              </label>
              <label className="casilla">
                <input type="checkbox" checked={d.firmado} onChange={(e) => cambiar(d.id, { firmado: e.target.checked })} />
                Con firma electrónica
              </label>
              <label className="crece">
                Indicaciones
                <input value={d.notas ?? ''} placeholder="opcional" onChange={(e) => cambiar(d.id, { notas: e.target.value })} />
              </label>
            </div>
          </div>
        ))}
        <button className="boton" onClick={anadir}>
          <Plus size={14} /> Añadir documento
        </button>
      </section>

      <section>
        <div className="seccion-titulo">Así lo verá la persona usuaria</div>
        <div className="vista-previa formulario-previa">
          <h3>{titulo}</h3>
          {docs.map((d) => (
            <div key={d.id} className="subida">
              <FileUp size={18} />
              <div>
                <div className="campo-etiqueta">
                  {d.nombre}
                  {d.obligatorio && <span className="obligatorio"> *</span>}
                </div>
                <div className="campo-ayuda">
                  {FORMATOS_DOC[d.formato]}
                  {d.firmado && ' · firmado electrónicamente'}
                  {d.notas && ` · ${d.notas}`}
                </div>
              </div>
              <span className="boton falso">Subir</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
