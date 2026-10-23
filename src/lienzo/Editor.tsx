import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import {
  addEdge,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  ViewportPortal,
  type Connection,
  type NodeChange,
} from '@xyflow/react'
import { toPng, toSvg } from 'html-to-image'
import { Rows3 } from 'lucide-react'
import { aParrilla, limpiar, nuevoId, PARRILLA } from '../almacen'
import { ORDEN_TIPOS, TIPOS } from '../catalogo'
import { PLANTILLA_VACIA, variablesDe } from '../dominio'
import { Dialogo } from '../editores/Dialogo'
import { EditorCampos } from '../editores/EditorCampos'
import { EditorEstructura } from '../editores/EditorEstructura'
import { EditorPlantilla } from '../editores/EditorPlantilla'
import { EditorRequisitos } from '../editores/EditorRequisitos'
import { ALTO_CARRIL, ANCHO_FASE, dentroDe, ESTRUCTURA_VACIA, limitesDibujo, primeraBanda, reubicar, type Eje } from '../estructura'
import type { Banda, Conexion, ConexionData, Esquema, Estructura, Nodo, NodoData, Tipo } from '../tipos'
import { revisar, type Problema } from '../validacion'
import { Barra } from './Barra'
import { Carriles } from './Carriles'
import { ConexionFlujo, Flechas } from './ConexionFlujo'
import { Inspector, type QueEditar } from './Inspector'
import { Leyenda } from './Leyenda'
import { LecturaContexto, resaltar, type ModoLectura } from './lectura'
import { NodoFlujo, ProblemasContexto } from './NodoFlujo'
import { Revision } from './Revision'

const nodeTypes = { nodo: NodoFlujo }
const edgeTypes = { conexion: ConexionFlujo }
const MIME = 'application/x-flujus-tipo'

type EstadoDialogo = { que: QueEditar; id: string } | { que: 'estructura' }

interface Props {
  esquema: Esquema
  tema: 'light' | 'dark'
  onCambio: (id: string, cambios: Partial<Esquema>) => void
}

export function Editor(props: Props) {
  return (
    <ReactFlowProvider>
      <EditorInterno {...props} />
    </ReactFlowProvider>
  )
}

function EditorInterno({ esquema, tema, onCambio }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Nodo>(esquema.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Conexion>(esquema.edges)
  const [estructura, setEstructura] = useState<Estructura>(esquema.estructura ?? ESTRUCTURA_VACIA)
  const { screenToFlowPosition, fitView } = useReactFlow()
  const envoltorio = useRef<HTMLDivElement>(null)
  const ultimoGuardado = useRef(JSON.stringify({ ...limpiar(esquema.nodes, esquema.edges), estructura: esquema.estructura ?? ESTRUCTURA_VACIA }))
  const [dialogo, setDialogo] = useState<EstadoDialogo | null>(null)
  const cerrarDialogo = useCallback(() => setDialogo(null), [])
  const [modo, setModo] = useState<ModoLectura | null>(null)
  const [encima, setEncima] = useState<string | null>(null)
  const [revisando, setRevisando] = useState(false)

  // Copias siempre al día para los manejadores que se disparan muy seguido
  // (arrastrar bordes y grupos) antes de que React vuelva a pintar.
  const nodosRef = useRef(nodes)
  nodosRef.current = nodes
  const estructuraRef = useRef(estructura)
  // Lo que hay dentro de cada grupo se fija al empezar a arrastrarlo; si se
  // calculara a cada paso, el grupo iría recogiendo cajas por el camino.
  const contenidoGrupos = useRef(new Map<string, string[]>())

  // Autoguardado: solo cuando cambia el contenido, no la selección.
  useEffect(() => {
    const t = setTimeout(() => {
      const limpio = { ...limpiar(nodes, edges), estructura }
      const json = JSON.stringify(limpio)
      if (json === ultimoGuardado.current) return
      ultimoGuardado.current = json
      onCambio(esquema.id, limpio)
    }, 300)
    return () => clearTimeout(t)
  }, [nodes, edges, estructura, esquema.id, onCambio])

  // Ajuste a la parrilla hecho a mano: el snapToGrid de React Flow ajusta la
  // esquina de la caja, no el centro, y con alturas distintas las flechas
  // salían con escalón. Además, al mover un grupo se mueve lo que tiene dentro.
  const alMoverNodos = useCallback(
    (cambios: NodeChange<Nodo>[]) => {
      const redimensionando = new Set(cambios.flatMap((c) => (c.type === 'dimensions' && c.resizing ? [c.id] : [])))
      const yaSeMueven = new Set(cambios.flatMap((c) => (c.type === 'position' ? [c.id] : [])))
      const actuales = new Map(nodosRef.current.map((n) => [n.id, n]))
      const arrastrados: NodeChange<Nodo>[] = []

      const ajustados = cambios.map((c) => {
        if (c.type !== 'position' || !c.position || redimensionando.has(c.id)) return c
        const pos = { x: aParrilla(c.position.x), y: aParrilla(c.position.y) }
        const grupo = actuales.get(c.id)
        const hijos = contenidoGrupos.current.get(c.id)
        if (grupo && hijos) {
          const dx = pos.x - grupo.position.x
          const dy = pos.y - grupo.position.y
          if (dx || dy) {
            for (const id of hijos) {
              const h = actuales.get(id)
              if (h && !yaSeMueven.has(id)) arrastrados.push({ type: 'position', id, position: { x: h.position.x + dx, y: h.position.y + dy } })
            }
          }
        }
        return { ...c, position: pos }
      })
      onNodesChange([...ajustados, ...arrastrados])
    },
    [onNodesChange],
  )

  // --- Carriles y fases -----------------------------------------------------

  const cambiarBandas = useCallback(
    (eje: Eje, nuevas: Banda[], origen?: number) => {
      const viejo = estructuraRef.current
      const clave = eje === 'y' ? 'carriles' : 'fases'
      const claveOrigen = eje === 'y' ? 'y0' : 'x0'
      const nueva = { ...viejo, [clave]: nuevas, [claveOrigen]: origen ?? viejo[claveOrigen] }
      estructuraRef.current = nueva
      setEstructura(nueva)
      setNodes((ns) => reubicar(ns, eje, viejo[claveOrigen], viejo[clave], nuevas))
    },
    [setNodes],
  )

  const cambiarTamano = useCallback(
    (eje: Eje, i: number, tamano: number) => {
      const bandas = eje === 'y' ? estructuraRef.current.carriles : estructuraRef.current.fases
      if (bandas[i]?.tamano === tamano) return
      cambiarBandas(eje, bandas.map((b, j) => (j === i ? { ...b, tamano } : b)))
    },
    [cambiarBandas],
  )

  const anadirBanda = (eje: Eje) => {
    const bandas = eje === 'y' ? estructuraRef.current.carriles : estructuraRef.current.fases
    const n = bandas.length + 1
    const nombre = eje === 'y' ? `Carril ${n}` : `Fase ${n}`
    if (bandas.length === 0) {
      const { origen, tamano } = primeraBanda(nodes, eje)
      cambiarBandas(eje, [{ id: nuevoId(), nombre, tamano }], origen)
    } else {
      cambiarBandas(eje, [...bandas, { id: nuevoId(), nombre, tamano: eje === 'y' ? ALTO_CARRIL : ANCHO_FASE }])
    }
  }

  // --- Cajas y conexiones ---------------------------------------------------

  const onConnect = useCallback(
    (c: Connection) => setEdges((es) => addEdge<Conexion>({ ...c, id: nuevoId(), type: 'conexion', data: { tipo: 'normal' } }, es)),
    [setEdges],
  )

  // Arrastrar un extremo de la flecha la lleva a otro lado de la caja o a otra caja.
  // El tramo central vuelve a su sitio porque la ruta cambia.
  const onReconnect = useCallback(
    (vieja: Conexion, nueva: Connection) =>
      setEdges((es) =>
        es.map((e) =>
          e.id === vieja.id
            ? { ...e, source: nueva.source, target: nueva.target, sourceHandle: nueva.sourceHandle, targetHandle: nueva.targetHandle, data: { tipo: 'normal', ...e.data, desvio: undefined } }
            : e,
        ),
      ),
    [setEdges],
  )

  const agregar = useCallback(
    (tipo: Tipo, centro: { x: number; y: number }) => {
      const data: NodoData = { tipo, titulo: TIPOS[tipo].tituloInicial }
      if (tipo === 'fin') data.resultado = 'ok'
      const nuevo: Nodo = { id: nuevoId(), type: 'nodo', position: { x: aParrilla(centro.x), y: aParrilla(centro.y) }, data, selected: true }
      if (tipo === 'grupo') Object.assign(nuevo, { width: 380, height: 220, zIndex: -1 })
      setNodes((ns) => [...ns.map((n) => ({ ...n, selected: false })), nuevo])
    },
    [setNodes],
  )

  const agregarEnCentro = (tipo: Tipo) => {
    const r = envoltorio.current!.getBoundingClientRect()
    const desfase = (nodes.length % 5) * PARRILLA // para que no se apilen exactamente
    agregar(tipo, screenToFlowPosition({ x: r.left + r.width / 2 + desfase, y: r.top + r.height / 2 + desfase }))
  }

  const onDrop = (ev: DragEvent) => {
    ev.preventDefault()
    const tipo = ev.dataTransfer.getData(MIME) as Tipo
    if (tipo in TIPOS) agregar(tipo, screenToFlowPosition({ x: ev.clientX, y: ev.clientY }))
  }

  const actualizarNodo = useCallback(
    (id: string, cambios: Partial<NodoData>) =>
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...cambios } } : n))),
    [setNodes],
  )

  const actualizarConexion = useCallback(
    (id: string, cambios: Partial<ConexionData>) =>
      setEdges((es) => es.map((e) => (e.id === id ? { ...e, data: { tipo: 'normal', ...e.data, ...cambios } } : e))),
    [setEdges],
  )

  const borrar = useCallback(
    (ids: string[]) => {
      setNodes((ns) => ns.filter((n) => !ids.includes(n.id)))
      setEdges((es) => es.filter((e) => !ids.includes(e.id) && !ids.includes(e.source) && !ids.includes(e.target)))
    },
    [setNodes, setEdges],
  )

  const abrirEstructura = useCallback(() => setDialogo({ que: 'estructura' }), [])

  // --- Revisión -------------------------------------------------------------

  const problemas = useMemo(() => revisar(nodes, edges), [nodes, edges])
  const problemasPorCaja = useMemo(() => {
    const m = new Map<string, { nivel: Problema['nivel']; textos: string[] }>()
    if (!revisando) return m
    for (const p of problemas) {
      const id = p.nodo ?? edges.find((e) => e.id === p.conexion)?.source
      if (!id) continue
      const previo = m.get(id)
      m.set(id, { nivel: previo?.nivel === 'error' || p.nivel === 'error' ? 'error' : 'aviso', textos: [...(previo?.textos ?? []), p.texto] })
    }
    return m
  }, [problemas, revisando, edges])

  const irA = (p: Problema) => {
    const id = p.nodo ?? edges.find((e) => e.id === p.conexion)?.source
    setNodes((ns) => ns.map((n) => ({ ...n, selected: !p.conexion && n.id === id })))
    setEdges((es) => es.map((e) => ({ ...e, selected: e.id === p.conexion })))
    if (id) fitView({ nodes: [{ id }], duration: 300, maxZoom: 1, padding: 1.5 })
  }

  // --- Modo lectura ---------------------------------------------------------

  const elegidos = nodes.filter((n) => n.selected && n.data.tipo !== 'grupo').map((n) => n.id)
  const desde = (elegidos.length ? elegidos : encima ? [encima] : []).join(' ')
  const luz = useMemo(() => (modo && desde ? resaltar(modo, desde.split(' '), edges) : null), [modo, desde, edges])
  const nodosVista = useMemo(
    () => (luz ? nodes.map((n) => (n.data.tipo === 'grupo' || luz.nodos.has(n.id) ? n : { ...n, className: 'atenuado' })) : nodes),
    [nodes, luz],
  )
  const conexionesVista = useMemo(
    () => (luz ? edges.map((e) => ({ ...e, className: luz.conexiones.has(e.id) ? 'iluminada' : 'atenuado' })) : edges),
    [edges, luz],
  )

  // --- Imagen ---------------------------------------------------------------

  const exportarImagen = async (formato: 'png' | 'svg') => {
    if (nodes.length === 0) return
    const vista = envoltorio.current?.querySelector<HTMLElement>('.react-flow__viewport')
    if (!vista) return
    const r = limitesDibujo(nodes, estructura)
    const margen = 40
    const ancho = Math.ceil(r.x2 - r.x1 + 2 * margen)
    const alto = Math.ceil(r.y2 - r.y1 + 2 * margen)
    const opciones = {
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      width: ancho,
      height: alto,
      pixelRatio: 2,
      style: { width: `${ancho}px`, height: `${alto}px`, transform: `translate(${margen - r.x1}px, ${margen - r.y1}px) scale(1)` },
      // Fuera los tiradores de conexión y de tamaño.
      filter: (n: HTMLElement) => !n.classList?.contains('react-flow__handle') && !n.classList?.contains('react-flow__resize-control'),
    }
    // Sin selección, atenuados ni marcas de revisión: la imagen sale limpia.
    envoltorio.current!.classList.add('exportando')
    let url: string
    try {
      url = formato === 'png' ? await toPng(vista, opciones) : await toSvg(vista, opciones)
    } finally {
      envoltorio.current!.classList.remove('exportando')
    }
    const a = document.createElement('a')
    a.href = url
    a.download = `${esquema.nombre.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase() || 'esquema'}.${formato}`
    a.click()
  }

  const haySeleccion = nodes.some((n) => n.selected) || edges.some((e) => e.selected)
  const enDialogo = dialogo && dialogo.que !== 'estructura' ? nodes.find((n) => n.id === dialogo.id) : undefined

  return (
    <div className="editor" ref={envoltorio}>
      <ProblemasContexto.Provider value={problemasPorCaja}>
      <LecturaContexto.Provider value={luz?.conexiones ?? null}>
      <ReactFlow
        nodes={nodosVista}
        edges={conexionesVista}
        onNodesChange={alMoverNodos}
        onNodeMouseEnter={(_, n) => setEncima(n.id)}
        onNodeMouseLeave={() => setEncima(null)}
        onNodeDragStart={(_, __, arrastrados) => {
          for (const g of arrastrados.filter((n) => n.data.tipo === 'grupo')) {
            contenidoGrupos.current.set(g.id, dentroDe(g, nodosRef.current).map((n) => n.id))
          }
        }}
        onNodeDragStop={() => contenidoGrupos.current.clear()}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'conexion' }}
        connectionMode={ConnectionMode.Loose}
        colorMode={tema}
        nodeOrigin={[0.5, 0.5]}
        elevateNodesOnSelect={false}
        deleteKeyCode={dialogo ? null : ['Backspace', 'Delete']}
        onDragOver={(ev) => {
          ev.preventDefault()
          ev.dataTransfer.dropEffect = 'move'
        }}
        onDrop={onDrop}
        fitView
        fitViewOptions={{ padding: { top: '90px', right: '40px', bottom: '110px', left: '260px' }, maxZoom: 1 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={PARRILLA} size={1.4} color="var(--punto)" />
        {/* Las puntas de flecha van dentro del lienzo para que salgan al exportar la imagen. */}
        <ViewportPortal>
          <Flechas />
        </ViewportPortal>
        <Carriles estructura={estructura} nodos={nodes} onTamano={cambiarTamano} onAbrir={abrirEstructura} />

        <Panel position="top-left" className="panel paleta">
          <div className="panel-titulo">Elementos</div>
          {ORDEN_TIPOS.map((t) => {
            const Icono = TIPOS[t].icono
            return (
              <button
                key={t}
                className={`paleta-item t-${t}`}
                draggable
                onDragStart={(ev) => {
                  ev.dataTransfer.setData(MIME, t)
                  ev.dataTransfer.effectAllowed = 'move'
                }}
                onClick={() => agregarEnCentro(t)}
                title={`${TIPOS[t].ayuda}. Arrastra al lienzo o haz clic.`}
              >
                <span className="muestra">
                  <Icono size={12} />
                </span>
                {TIPOS[t].nombre}
              </button>
            )
          })}
          <div className="paleta-separador" />
          <button className="paleta-item" onClick={abrirEstructura} title="Filas por actor y columnas por fase">
            <span className="muestra neutra">
              <Rows3 size={12} />
            </span>
            Carriles y fases
          </button>
        </Panel>

        {haySeleccion ? (
          <Panel position="top-right" className="panel inspector">
            <Inspector
              nodos={nodes}
              conexiones={edges}
              estructura={estructura}
              onNodo={actualizarNodo}
              onConexion={actualizarConexion}
              onBorrar={borrar}
              onAbrir={(id, que) => setDialogo({ id, que })}
            />
          </Panel>
        ) : (
          <Panel position="top-right" className="pista">
            Arrastra elementos al lienzo · une cajas desde sus bordes · clic para editar · Supr borra
          </Panel>
        )}

        <Panel position="bottom-left" className="leyenda">
          <Leyenda nodos={nodes} conexiones={edges} />
        </Panel>

        {revisando && (
          <Panel position="bottom-right" className="panel revision">
            <Revision problemas={problemas} onIr={irA} onCerrar={() => setRevisando(false)} />
          </Panel>
        )}

        <Panel position="bottom-right" className="panel-barra">
          <Barra
            modo={modo}
            onModo={setModo}
            revisando={revisando}
            onRevisar={() => setRevisando((r) => !r)}
            errores={problemas.filter((p) => p.nivel === 'error').length}
            avisos={problemas.filter((p) => p.nivel === 'aviso').length}
            onImagen={exportarImagen}
          />
        </Panel>
      </ReactFlow>
      </LecturaContexto.Provider>
      </ProblemasContexto.Provider>

      {dialogo?.que === 'estructura' && (
        <Dialogo antetitulo="Esquema" titulo="Carriles y fases" onCerrar={cerrarDialogo}>
          <EditorEstructura estructura={estructura} nodos={nodes} onBandas={cambiarBandas} onAnadir={anadirBanda} />
        </Dialogo>
      )}

      {enDialogo && dialogo && (
        <Dialogo antetitulo={TIPOS[enDialogo.data.tipo].nombre} titulo={enDialogo.data.titulo} onCerrar={cerrarDialogo}>
          {dialogo.que === 'campos' && (
            <EditorCampos titulo={enDialogo.data.titulo} campos={enDialogo.data.campos ?? []} onCambio={(campos) => actualizarNodo(enDialogo.id, { campos })} />
          )}
          {dialogo.que === 'requisitos' && (
            <EditorRequisitos titulo={enDialogo.data.titulo} docs={enDialogo.data.requisitos ?? []} onCambio={(requisitos) => actualizarNodo(enDialogo.id, { requisitos })} />
          )}
          {dialogo.que === 'plantilla' && (
            <EditorPlantilla
              plantilla={enDialogo.data.plantilla ?? PLANTILLA_VACIA}
              variables={variablesDe(nodes)}
              onCambio={(plantilla) => actualizarNodo(enDialogo.id, { plantilla })}
            />
          )}
        </Dialogo>
      )}
    </div>
  )
}
