# Guía de interacción educativa y visual

**Fecha:** 2026-11-14  
**Estado:** activo  
**Motivo:** Contratos pedagógicos reutilizables para agentes.  
**Evidencia:** `PRODUCT_VISION.md`, `UX_PRESENTATION_STANDARD.md` §B, datos en `SystemEducationalData.ts`.  
**Alcance:** guía; no altera textos publicados.  
**Commit relacionado:** `chore/opex-ai-agents-v1`

## Secuencia canónica
**Leer → Visualizar → Interactuar → Comprender → Aplicar.**

## Guion por interacción
1. **Observar** — qué debe notar el lector en la escena.
2. **Actuar** — clic/teclado/táctil con consecuencia clara.
3. **Comprender** — concepto que se revela (brief + ficha).
4. **Reflexionar** — acción del líder o pregunta de transferencia.

## Clasificación de afirmaciones
| Tipo | Uso |
| --- | --- |
| Documentado | Texto/editorial aprobado en repo |
| Hipotético | Caso ilustrativo (p. ej. solicitud con riesgo de retraso) |
| Supuesto | Inferencia del agente; marcar siempre |

## Visual
- La escena debe aportar comprensión sin depender solo del párrafo.
- Controles HTML accesibles; `prefers-reduced-motion`.
- 4 paletas × 2 temas.
- Presentación: reutilizar `presentationEngine.ts`.

## Responsive / presentación
La matriz de viewports y el presupuesto vertical al 100 % de zoom están en `docs/UX_PRESENTATION_STANDARD.md` (no duplicar aquí).
