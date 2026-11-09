# Posibles mejoras

**Edición**
- Copiar, pegar y duplicar cajas (Ctrl+C/V/D); alinear y repartir varias cajas seleccionadas.
- Tramo movible también en flechas que salen y entran por lados no opuestos; hoy el desvío es
  absoluto respecto al centro por defecto y puede quedar raro si se mueve mucho una caja.

**Modelo de RR. HH.**
- Plazos en las esperas (días hábiles o naturales) y aviso de vencimiento.
- Estados del expediente (presentada, en subsanación, resuelta…) derivados del flujo.
- Validaciones de campos (DNI, fechas, rangos) y campos que aparecen según otro campo.
- Catálogo de campos reutilizables (datos personales, puesto, unidad) compartido entre esquemas.
- Enlazar normativa a cada paso (la de `~/dev/agentus/normativa/`).
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
