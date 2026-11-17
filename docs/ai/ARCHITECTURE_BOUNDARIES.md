# Límites de arquitectura real (OPEX LÍDER)

**Fecha:** 2026-11-14  
**Estado:** verificado en `chore/opex-ai-agents-v1` @ base `f88ddc2`  
**Motivo:** `docs/TECH_ARCHITECTURE.md` describe una propuesta temprana; este documento refleja el código presente.  
**Evidencia:** `package.json`, `src/lib/**`, `src/components/**`  
**Alcance:** contratos entre capas; no autoriza refactors.  
**Commit relacionado:** pendiente en rama `chore/opex-ai-agents-v1`

## Stack verificado
- Astro (estático) + TypeScript
- Three.js `0.187.0` + GSAP `3.15.1` + `@types/three` (dev)
- Playwright + `node:test` según suite del repo

## Capas y contratos

| Capa | Ubicación | Responsabilidad | No debe |
| --- | --- | --- | --- |
| Contenido editorial | `src/pages/*.astro`, datos educativos en lib | Textos, estructura de capítulo | Lógica Three.js / GPU |
| Shell del libro | `src/layouts/`, `src/components/book/`, `bookManifest.ts` | Navegación, tema, paletas, búsqueda | Escenas 3D de página |
| Motores de interacción 2D/FLIP | `expandableCardEngine.ts`, diagramas SVG | Tarjetas, FLIP, pointer | Duplicar presentación |
| Presentación | `presentationEngine.ts` | Fullscreen, HUD, teclado, restore | Motores fullscreen paralelos |
| Dominio KPI | `otifEngine.ts` | Cálculo OTIF puro | DOM |
| 3D cubierta | `src/lib/gears3d/*` | Engranajes página 00 | Geometría de sistema 02 |
| 3D sistema | `src/lib/system3d/*` | Escena 4 fuerzas página 02 | Cambiar textos sin pedagogía |
| Estilos de página | `src/styles/page-*.css` | Aislamiento visual por página | Contaminar `global.css` sin necesidad |
| Infra / CSP | `public/_headers`, CI | Seguridad y release | Editar sin autorización |

## Dependencias entre motores 3D
- `InteractiveSystem.astro` (u homólogo) orquesta UI + `system3d`.
- `SystemEducationalData` / `SystemForceStories` = contrato pedagógico → escena.
- `SystemGeometry` = meshes procedurales actuales (humanoides por primitivas).
- `SystemScene3D` + `SystemCameraFraming` + `SystemAppState` + `SystemInteraction` = runtime.
- `GearScene3D` es dominio separado (página 00); no fusionar con `system3d` sin ADR.

## Extensión a páginas 10–19
- Nueva experiencia compleja: `src/components/diagrams/` + `src/lib/<feature>/` + `src/styles/page-XX-*.css`.
- Reutilizar `presentationEngine` y tokens de paleta/tema.
- Registrar ADR si se introduce loader GLB compartido o un runtime 3D común.

## Estado funcional de página 02 — HARDENING-02

`SystemAppStateController` es la autoridad de selección, pausa, relaciones, recorrido y ficha. La vista envía intenciones al controlador; `SystemScene3D` se suscribe al snapshot incluso si se inicializa después de aplicar una URL. Su caché de revisión solo evita repetir efectos, no mantiene otra selección funcional. El director GSAP ejecuta o pausa la timeline según el estado aplicado y la visibilidad. Cámara/hover/medidas GPU son estado de presentación; no deben modificar la selección educativa.

La pausa persiste al cambiar de fuerza; restaurar o iniciar un recorrido reanuda. El encuadre mantiene las poses y geometría existentes, cancela interpolaciones incompatibles al recalcular layout y expone finalización real para las pruebas. No implica aprobación visual de los personajes.
