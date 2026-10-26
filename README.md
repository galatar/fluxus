# Fluxus

Editor de diagramas de flujo para modelar aplicaciones de gestión administrativa de RR. HH.
Pensado para que lo use alguien que no programa: cajas para tareas, formularios, documentos
aportados y generados, decisiones, plazos y avisos.

```bash
npm install
npm run dev
```

Los esquemas se guardan en el navegador (localStorage) y se pueden exportar/importar como JSON.

## Tecnologías

Fluxus es una SPA de **React 19 + TypeScript 6 sobre Vite 8**, sin backend: todo el estado
vive en el navegador (localStorage) y los esquemas se exportan/importan como JSON.

### Núcleo

- **React 19.3** (`react` + `react-dom`) — interfaz.
- **TypeScript ~6.0** — todo el código tipado, con configuración estricta (`noUnusedLocals`,
  `noUnusedParameters`, `noFallthroughCasesInSwitch`, `erasableSyntaxOnly`).
- **Vite 8.3** — bundler y servidor de desarrollo, con `@vitejs/plugin-react` 6.1.

### Librerías de aplicación

- **`@xyflow/react` 12.12** (React Flow) — motor del editor de diagramas: nodos (cajas),
  aristas (flechas), lienzo, selección y arrastre.
- **`lucide-react` 1.61** — iconos.
- **`html-to-image` 1.11** — exportar el lienzo a PNG/SVG.
- **`@fontsource-variable/jetbrains-mono` 5.3** — tipografía mono (estética archify).

### Herramientas de desarrollo

- **oxlint 1.88** — linter (en Rust); `npm run lint`.
- **`@types/node` 24**, **`@types/react` 19**, **`@types/react-dom` 19** — tipos.

### Configuración TypeScript destacable

- `target` ES2023, `module` esnext, `moduleResolution: "bundler"`.
- `allowImportingTsExtensions` → imports con extensión `.ts`/`.tsx` explícita.
- `verbatimModuleSyntax` → imports de tipos explícitos (`import type`).
- `jsx: "react-jsx"` → nuevo transform JSX, sin importar React.
- Proyecto dividido en `tsconfig.app.json` (código, DOM) y `tsconfig.node.json` (config de Vite).

### Persistencia

- Sin backend: los datos viven en **localStorage** (`fluxus:esquemas`, `fluxus:activo`,
  `fluxus:tema`, `fluxus:lateral`, `fluxus:orden`).
- Build: `tsc -b && vite build` (comprobación de tipos + empaquetado).
