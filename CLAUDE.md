# Fluxus

Editor de diagramas de flujo para modelar aplicaciones de gestión administrativa de RR. HH.
(PTGAS, Universidad de Sevilla). Lo usa gente que no programa: el lenguaje de la interfaz es
llano y en español, sin jerga técnica. El aspecto imita los esquemas de archify (fondo de puntos,
cajas redondeadas con borde de color y relleno suave, tipografía mono, carriles y fases).

Todo el código, los nombres y los comentarios van en español.

## Comandos

```bash
npm run dev      # Vite, normalmente en http://localhost:5199 (npx vite --port 5199)
npm run build    # tsc -b + vite build: tiene que pasar antes de cada commit
npx oxlint src   # 1 aviso conocido y aceptado (ref en render en Editor, patrón deliberado)
```

## Stack

Vite 8 + React 19 + TypeScript 6, `@xyflow/react` 12 (React Flow), `lucide-react`,
`html-to-image` (exportar PNG/SVG), JetBrains Mono. Sin backend: los esquemas viven en
localStorage (`fluxus:esquemas`, más `fluxus:activo`, `fluxus:tema`, `fluxus:lateral`, `fluxus:orden`, `fluxus:paleta`).

## Mapa del código (`src/`)

| Fichero | Qué hace |
|---|---|
| `tipos.ts` | Modelo: `Nodo`/`NodoData`, `Conexion`/`ConexionData`, `Campo`, `Plantilla`, `DocRequerido`, `Condicion`, `Banda`, `Estructura`, `Esquema` |
| `catalogo.ts` | Tipos de caja (nombre, ayuda, icono) y de conexión |
| `almacen.ts` | Carga/guarda, `migrar()` (versión 2), `limpiar()`, importar/exportar JSON, esquema de ejemplo (teletrabajo) |
| `dominio.ts` | Campos, claves `{{variable}}`, operadores, resumen de cada caja |
| `estructura.ts` | Carriles (filas, eje y) y fases (columnas, eje x): tramos, `reubicar()`, marco, límites para exportar |
| `busqueda.ts` | `buscar()`: cajas (título, detalle, notas), campos de formulario (pregunta, clave, ayuda, opciones) y documentos que se piden (nombre, indicaciones); sin tildes ni mayúsculas, todas las palabras |
| `validacion.ts` | `revisar()`: errores y avisos del panel Revisar |
| `lienzo/Editor.tsx` | Editor principal: estado, parrilla, grupos, autoguardado, historial, atajos, exportar imagen |
| `lienzo/NodoFlujo.tsx`, `ConexionFlujo.tsx` | Caja y flecha personalizadas (tramo central movible en la flecha) |
| `lienzo/Carriles.tsx` | Carriles y fases dibujados detrás de las cajas, con bordes arrastrables |
| `lienzo/historial.ts` | Deshacer/rehacer con fotos JSON del esquema |
| `lienzo/lectura.ts` | Modos Camino y Foco |
| `lienzo/Paleta.tsx` | Panel «Elementos»: se mueve por la cabecera (queda dentro del lienzo) y se pliega; posición y estado en `fluxus:paleta` |
| `lienzo/Buscador.tsx` | Panel de búsqueda (⌘/Ctrl+F o botón «Buscar»): mientras hay consulta, las cajas sin coincidencia se atenúan; un campo o un documento abre su diálogo y lo marca |
| `lienzo/Barra.tsx`, `Inspector.tsx`, `Revision.tsx`, `Leyenda.tsx` | Paneles |
| `editores/` | Diálogos: campos de formulario, plantilla, documentos pedidos, condición, carriles y fases |
| `App.tsx` | Lista de esquemas (plegable), cabecera, importar/exportar |

## Cosas que ya nos mordieron (no deshacer)

- **Las cajas se colocan por su centro** (`nodeOrigin={[0.5, 0.5]}`) y el ajuste a la parrilla de 20 px
  se hace a mano en `alMoverNodos`. El `snapToGrid` de React Flow ajusta la esquina aunque haya
  nodeOrigin, y con alturas distintas las flechas salían con escalón. No volver a activarlo.
- **Grupos**: lo que contienen se fija en `onNodeDragStart`; si se recalcula a cada paso, el grupo
  va recogiendo cajas por el camino. Al redimensionar no se ajusta la posición a la parrilla.
- **Puntas de flecha** con `markerUnits="userSpaceOnUse"` (si no, crecen con el grosor de línea al exportar).
- **Al exportar** se añade la clase `exportando` para quitar selección, atenuado, marcas de revisión,
  extremos y tramos de las flechas.
- **El inspector no hace autofocus**: si lo hace, Supr y Ctrl+Z van al campo y no al lienzo.
- **El historial** anota una foto cuando el autoguardado ve el esquema estable (300 ms); la selección
  no entra en la foto y se conserva al deshacer.
- Las flechas de una decisión llevan `condicion` o `porDefecto`; el desvío del tramo central es `data.desvio`.

## Cómo se prueba

Siempre en un navegador de verdad y con el ratón, no solo colocando cosas por código:
`playwright-cli -s=fluxus` (en zsh: `P() { playwright-cli -s=fluxus "$@"; }`). El primer
`mousemove` tras `mousedown` solo arranca el arrastre: mover 1 px antes del recorrido. Las capturas
van a `.playwright-cli/` (ignorada en git). Comprobar el resultado leyendo `localStorage` y mirando
la captura. Decir «comprobado» o «sin comprobar», nunca «debería funcionar».

## Pendiente

1. **Probarlo con un procedimiento real del PTGAS** antes de seguir ampliando: ver si de verdad
   ahorra trabajo y qué falta. De paso, sale un artículo para el blog.
2. **Paso 5a, servidor para guardar y compartir.** Decisiones abiertas de Juánan: dónde vive
   (servidor de la US o local), stack (Symfony como Sirhus, o algo ligero tipo SQLite + API mínima)
   y acceso (SSO de la US o sin login en la intranet).
3. **Paso 5b, exportar como especificación** para Agentus o Symfony. Candidatos: documento Markdown
   del procedimiento; JSON Schema de cada formulario; plantillas Twig; configuración del componente
   Workflow de Symfony (cajas → lugares, flechas → transiciones, condiciones → guards).

## Posibles mejoras

**Edición**
- Copiar, pegar y duplicar cajas (Ctrl+C/V/D); alinear y repartir varias cajas seleccionadas.
- Tramo movible también en flechas que salen y entran por lados no opuestos; hoy el desvío es
  absoluto respecto al centro por defecto y puede quedar raro si se mueve mucho una caja.

**Modelo de RR. HH.**
- Plazos en las esperas (días hábiles o naturales) y aviso de vencimiento.
- Estados del expediente (presentada, en subsanación, resuelta…) derivados del flujo.
- Validaciones de campos (DNI, fechas, rangos) y campos que aparecen según otro campo.
- Catálogo de campos reutilizables (datos personales, puesto, unidad) compartido entre esquemas.
- Enlazar normativa a cada paso (la de `~/dev/agentus/agent/normativa/`).
- Subprocesos: una caja que abre otro esquema.

**Revisión y simulación**
- Simular: recorrer el flujo rellenando el formulario y ver qué camino toma cada decisión.
- Detectar condiciones solapadas o que no cubren todos los casos, y bucles sin salida.

**Exportar**
- Mermaid o BPMN 2.0 para llevarlo a otras herramientas; PDF con el manual del procedimiento.

**Calidad técnica**
- Tests con Vitest para `estructura`, `validacion`, `historial` y `migrar`.
- Partir `Editor.tsx` (≈500 líneas) en hooks: parrilla y grupos, estructura, exportar imagen.
- localStorage tiene un límite de unos 5 MB: avisar al acercarse o pasar a IndexedDB.
