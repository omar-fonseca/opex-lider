---
description: Producción 3D OPEX LÍDER — pipeline visual, assets GLB, escenas Three.js, animación y ciclo de vida GPU.
trigger: glob
globs: "**/src/lib/gears3d/**, **/src/lib/system3d/**, **/src/components/diagrams/*3D*.astro, **/src/components/diagrams/Constellation.astro, **/src/components/diagrams/InteractiveSystem.astro, **/src/styles/*3d*.css, **/public/**/*.glb, **/public/**/*.gltf, **/public/**/*.bin"
---

# Producción 3D

Referencias: `docs/ai/3D_PRODUCTION_STANDARD.md`, `docs/ai/3D_ASSETS_POLICY.md`, `docs/UX_PRESENTATION_STANDARD.md`.

## Pipeline
Requisito educativo → storyboard → dirección artística → modelo → licencia → rigging → animación → GLB optimizado → Three.js → controles a11y → pruebas → validación visual → aprobación.

## Reglas operativas
- Reutilizar `gears3d/` y `system3d/`; no crear motores paralelos.
- Ciclo de vida: selección, cámara, animación, restauración, `dispose` / liberación GPU.
- Controles HTML accesibles; escena no es el único canal de comprensión.
- Presupuesto de detalle desktop/móvil; carga diferida.
- Registrar licencia antes de integrar cualquier GLB/GLTF.
- Prohibido descargar assets o instalar paquetes en tareas no autorizadas.
- Páginas congeladas: no editar sin autorización explícita.
