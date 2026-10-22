import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import {
  addEdge,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
} from '@xyflow/react'
import { aParrilla, limpiar, nuevoId, PARRILLA } from '../almacen'
import { ORDEN_TIPOS, TIPOS } from '../catalogo'
import { PLANTILLA_VACIA, variablesDe } from '../dominio'
import { Dialogo } from '../editores/Dialogo'
import { EditorCampos } from '../editores/EditorCampos'
import { EditorPlantilla } from '../editores/EditorPlantilla'
import { EditorRequisitos } from '../editores/EditorRequisitos'
import type { Conexion, ConexionData, Esquema, Nodo, NodoData, Tipo } from '../tipos'
import { ConexionFlujo, Flechas } from './ConexionFlujo'
import { Inspector, type QueEditar } from './Inspector'
import { Leyenda } from './Leyenda'
import { NodoFlujo } from './NodoFlujo'

const nodeTypes = { nodo: NodoFlujo }
const edgeTypes = { conexion: ConexionFlujo }
const MIME = 'application/x-flujus-tipo'

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
  const { screenToFlowPosition } = useReactFlow()
  const envoltorio = useRef<HTMLDivElement>(null)
  const ultimoGuardado = useRef(JSON.stringify(limpiar(esquema.nodes, esquema.edges)))
  const [dialogo, setDialogo] = useState<{ id: string; que: QueEditar } | null>(null)
  const cerrarDialogo = useCallback(() => setDialogo(null), [])

  // Autoguardado: solo cuando cambia el contenido, no la selección.
  useEffect(() => {
    const t = setTimeout(() => {
      const limpio = limpiar(nodes, edges)
      const json = JSON.stringify(limpio)
      if (json === ultimoGuardado.current) return
      ultimoGuardado.current = json
      onCambio(esquema.id, limpio)
    }, 300)
    return () => clearTimeout(t)
  }, [nodes, edges, esquema.id, onCambio])

  const onConnect = useCallback(
    (c: Connection) => setEdges((es) => addEdge<Conexion>({ ...c, id: nuevoId(), type: 'conexion', data: { tipo: 'normal' } }, es)),
    [setEdges],
  )

  const agregar = useCallback(
    (tipo: Tipo, centro: { x: number; y: number }) => {
      const data: NodoData = { tipo, titulo: TIPOS[tipo].tituloInicial }
      if (tipo === 'fin') data.resultado = 'ok'
      const nuevo: Nodo = { id: nuevoId(), type: 'nodo', position: { x: aParrilla(centro.x), y: aParrilla(centro.y) }, data, selected: true }
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

  const haySeleccion = nodes.some((n) => n.selected) || edges.some((e) => e.selected)
  const enDialogo = dialogo && nodes.find((n) => n.id === dialogo.id)

  return (
    <div className="editor" ref={envoltorio}>
      <Flechas />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'conexion' }}
        connectionMode={ConnectionMode.Loose}
        colorMode={tema}
        nodeOrigin={[0.5, 0.5]}
        snapToGrid
        snapGrid={[PARRILLA, PARRILLA]}
        deleteKeyCode={dialogo ? null : ['Backspace', 'Delete']}
        onDragOver={(ev) => {
          ev.preventDefault()
          ev.dataTransfer.dropEffect = 'move'
        }}
        onDrop={onDrop}
        fitView
        fitViewOptions={{ padding: { top: '40px', right: '40px', bottom: '110px', left: '210px' }, maxZoom: 1 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={PARRILLA} size={1.4} color="var(--punto)" />

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
        </Panel>

        {haySeleccion ? (
          <Panel position="top-right" className="panel inspector">
            <Inspector
              nodos={nodes}
              conexiones={edges}
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

        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>

      {enDialogo && (
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
