# docs/ai — Contexto compartido para agentes

**Fecha:** 2026-11-14  
**Estado:** activo  
**Motivo:** Dar a Cursor/Antigravity un índice versionado sin duplicar `docs/PROJECT_STATE.md`.  
**Evidencia:** auditoría AI-TEAM-01 en worktree `opex-ai-agents-v1`.  
**Alcance:** documentación de orquestación; no cambia runtime.

Los agentes **no** comparten memoria automática. Deben leer estos archivos cuando apliquen.

## Documentos canónicos existentes (no duplicar)
| Documento | Rol |
| --- | --- |
| `docs/PRODUCT_VISION.md` | Visión y alcance de producto |
| `docs/TECH_ARCHITECTURE.md` | Arquitectura histórica / propuesta inicial |
| `docs/PROJECT_STATE.md` | Estado canónico de desarrollo, producción y continuidad |
| `docs/UX_PRESENTATION_STANDARD.md` | Responsive, zoom 100 %, presentación, DoD |

## Documentos AI (este directorio)
| Documento | Rol |
| --- | --- |
| `ARCHITECTURE_BOUNDARIES.md` | Límites reales entre componentes y motores |
| `adr/README.md` | Registro de decisiones arquitectónicas |
| `PAGE_STATUS_00_19.md` | Estado de páginas 00–19 |
| `APPROVAL_AND_FREEZE_POLICY.md` | Aprobación y congelación |
| `EDUCATIONAL_INTERACTION_GUIDE.md` | Guías de interacción educativa |
| `GOVERNANCE_BRANCH_MAP.md` | Mapa de ramas (corrige ambigüedad GOV-01) |
| `3D_PRODUCTION_STANDARD.md` | Pipeline de producción 3D |
| `3D_ASSETS_POLICY.md` | Modelos, licencias y optimización |
| `CURSOR_ANTIGRAVITY_HANDOFF.md` | Transferencia Cursor ↔ Antigravity |
| `reports/` | Informes de ejercicios (p. ej. delegación página 02) |

## Retomar desde cualquier IDE

Abrir `E:\opexLider`, verificar Git y leer `AGENTS.md` junto con el estado canónico. Las Skills portables viven en `.agents/skills/`; `.cursor/skills/` contiene adaptadores mínimos. Los cinco contratos existentes siguen en `.cursor/agents/` y pueden leerse como documentación desde otro IDE, sin afirmar que ese IDE los ejecuta como subagentes.

No crear nuevos agentes ni duplicar el contexto. Las referencias a rutas antiguas en informes/ADR describen la evidencia de su fecha, no el workspace actual.
