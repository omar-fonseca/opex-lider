# Política de modelos 3D, licencias y optimización

**Fecha:** 2026-11-14  
**Estado:** activo  
**Motivo:** Evitar assets sin procedencia y sustituir primitivas sin control.  
**Evidencia:** `SystemGeometry.ts` (“Personajes estilizados con primitivas — sin modelos externos”); ADR-0003.  
**Alcance:** política; cero descargas en AI-TEAM-01.  
**Commit relacionado:** `chore/opex-ai-agents-v1`

## Inventario actual (página 02, commit `f88ddc2`)
- Personajes: humanoides procedurales (cápsulas/primitivas) en `SystemGeometry.ts`.
- No hay GLB/GLTF versionados bajo `public/` para el sistema (verificar en cada worktree).

## Antes de integrar un asset
Registrar en informe o ADR:
- Nombre / rol en escena
- Procedencia (autor, URL, herramienta: Blender/Mixamo/etc.)
- Licencia y restricciones (comercial, atribución, share-alike)
- Formato (GLB preferido)
- Tris aprox., texturas, clips de animación
- LOD previsto (desktop/móvil)

## Prohibiciones
- Descargar o vender assets dentro de tareas no autorizadas.
- Sustituir personajes profesionales por muñecos geométricos **como solución final** sin aprobación (placeholder temporal debe etiquetarse como tal).
- Instalar paquetes de loaders extra si el stack actual basta (`three` GLTFLoader).

## Optimización
- Un GLB por personaje reutilizable o pack justificado.
- Draco/meshopt solo con ADR y aprobación (impacto en CSP/bundle).
- Probar dispose y ausencia de fugas al cambiar de fuerza/página.
