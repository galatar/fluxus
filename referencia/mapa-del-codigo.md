# Mapa del código (`src/`)

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
