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

## Referencia

- Mapa del código (`src/`): `referencia/mapa-del-codigo.md`
- Ideas de mejoras (edición, modelo de RR. HH., simulación, exportar, calidad técnica): `referencia/posibles-mejoras.md`

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
