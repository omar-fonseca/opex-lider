# Estándar de producción 3D

**Fecha:** 2026-11-14  
**Estado:** activo  
**Motivo:** Unificar el pipeline educativo → técnico.  
**Evidencia:** motores `gears3d` / `system3d`; UX standard; AI-TEAM-01.  
**Alcance:** proceso; **no** descarga de assets ni cambios de escena en esta tarea.  
**Commit relacionado:** `chore/opex-ai-agents-v1`

## Pipeline obligatorio
1. Requisito educativo  
2. Storyboard  
3. Dirección artística  
4. Selección o creación de modelos  
5. Licencia (registro escrito)  
6. Rigging  
7. Animaciones  
8. GLB optimizado  
9. Integración Three.js (reutilizar motores)  
10. Controles accesibles HTML  
11. Pruebas  
12. Validación visual (4×2 temas/paletas, viewports)  
13. Aprobación explícita del usuario  

## Control de tamaño, detalle y carga
| Control | Guía |
| --- | --- |
| Peso GLB | Presupuestar por escena; preferir un asset por rol / atlas compartido |
| Tris / draw calls | LOD desktop vs móvil; evitar densidades de personaje innecesarias |
| Texturas | Potencias de 2; comprimir; no cargar atlas no usados |
| Runtime | Lazy load del módulo 3D y del GLB; `dispose` al salir |
| Animación | `AnimationMixer` solo si hay clips; respetar `prefers-reduced-motion` |
| Fallback | HTML/ARIA debe explicar el concepto si 3D falla o se reduce |

## Roles
- Pedagogy + Art Director diseñan; Engineer implementa tras OK; Quality audita.
