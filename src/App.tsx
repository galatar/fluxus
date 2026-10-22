import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Download, Moon, Plus, Sparkles, Sun, Trash2, Upload, Workflow } from 'lucide-react'
import { cargarEsquemas, esquemaEjemplo, esquemaVacio, exportar, guardarEsquemas, importar, nuevoId } from './almacen'
import { Editor } from './lienzo/Editor'
import type { Esquema } from './tipos'

type Tema = 'light' | 'dark'

const leer = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const escribir = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    // Sin almacenamiento: la preferencia solo dura esta sesión.
  }
}

const fecha = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function App() {
  const [esquemas, setEsquemas] = useState<Esquema[]>(cargarEsquemas)
  const [activoId, setActivoId] = useState(() => leer('flujus:activo') ?? esquemas[0]?.id)
  const [tema, setTema] = useState<Tema>(() => (leer('flujus:tema') as Tema) ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  const ficheroRef = useRef<HTMLInputElement>(null)

  useEffect(() => guardarEsquemas(esquemas), [esquemas])
  useEffect(() => {
    document.documentElement.dataset.theme = tema
    escribir('flujus:tema', tema)
  }, [tema])
  useEffect(() => {
    if (activoId) escribir('flujus:activo', activoId)
  }, [activoId])

  const activo = esquemas.find((e) => e.id === activoId) ?? esquemas[0]

  const cambiar = useCallback((id: string, cambios: Partial<Esquema>) => {
    setEsquemas((es) => es.map((e) => (e.id === id ? { ...e, ...cambios, actualizado: new Date().toISOString() } : e)))
  }, [])

  const crear = (e: Esquema) => {
    setEsquemas((es) => [e, ...es])
    setActivoId(e.id)
  }

  const borrar = (e: Esquema) => {
    if (!confirm(`¿Borrar «${e.nombre}»? No se puede deshacer.`)) return
    setEsquemas((es) => es.filter((x) => x.id !== e.id))
  }

  const alImportar = async (f?: File) => {
    if (!f) return
    try {
      crear(await importar(f))
    } catch (err) {
      alert(`No se pudo importar: ${(err as Error).message}`)
    }
  }

  return (
    <div className="app">
      <aside className="lateral">
        <div className="marca">
          <Workflow size={18} />
          <span>Flujus</span>
        </div>

        <button className="boton primario" onClick={() => crear(esquemaVacio())}>
          <Plus size={14} /> Nuevo esquema
        </button>

        <div className="lista-titulo">Esquemas · {esquemas.length}</div>
        <nav className="lista">
          {esquemas.map((e, i) => (
            <div key={e.id} className={`esquema-item${e.id === activo?.id ? ' activo' : ''}`} onClick={() => setActivoId(e.id)}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <div className="esquema-texto">
                <div className="esquema-nombre">{e.nombre || 'Sin nombre'}</div>
                <div className="esquema-meta">
                  {e.nodes.length} elementos · {fecha.format(new Date(e.actualizado))}
                </div>
              </div>
              <div className="acciones" onClick={(ev) => ev.stopPropagation()}>
                <button title="Duplicar" onClick={() => crear({ ...structuredClone(e), id: nuevoId(), nombre: `${e.nombre} (copia)` })}>
                  <Copy size={13} />
                </button>
                <button title="Borrar" onClick={() => borrar(e)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </nav>

        <div className="pie">
          <button className="boton" onClick={() => crear(esquemaEjemplo())} title="Añade una copia del ejemplo de teletrabajo">
            <Sparkles size={13} /> Ver un ejemplo
          </button>
          <button className="boton" onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')} title="Cambiar tema">
            {tema === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          <input
            ref={ficheroRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(ev) => {
              alImportar(ev.target.files?.[0])
              ev.target.value = ''
            }}
          />
        </div>
      </aside>

      <main className="principal">
        {activo ? (
          <>
            <header className="cabecera">
              <input className="nombre" value={activo.nombre} onChange={(e) => cambiar(activo.id, { nombre: e.target.value })} placeholder="Nombre del esquema" />
              <input
                className="descripcion"
                value={activo.descripcion}
                onChange={(e) => cambiar(activo.id, { descripcion: e.target.value })}
                placeholder="Para qué sirve esta aplicación o módulo"
              />
              <button className="boton" onClick={() => ficheroRef.current?.click()} title="Abrir un esquema exportado (.json)">
                <Upload size={13} /> Importar
              </button>
              <button className="boton" onClick={() => exportar(activo)} title="Descargar este esquema como .json">
                <Download size={13} /> Exportar
              </button>
            </header>
            <Editor key={activo.id} esquema={activo} tema={tema} onCambio={cambiar} />
          </>
        ) : (
          <div className="vacio">
            <p>No hay ningún esquema.</p>
            <div className="fila-centrada">
              <button className="boton primario" onClick={() => crear(esquemaVacio())}>
                <Plus size={14} /> Crear el primero
              </button>
              <button className="boton" onClick={() => ficheroRef.current?.click()}>
                <Upload size={13} /> Importar
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
