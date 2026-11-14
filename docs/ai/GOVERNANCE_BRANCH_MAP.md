# Mapa de gobernanza de ramas (corrección mínima)

**Fecha:** 2026-11-14  
**Estado:** propuesto / documentado  
**Motivo:** Resolver contradicción entre GOV-01 (`integration/v1-interactive-book` como única partida) y commits locales de 2ª edición visual (00–02) posteriores a `main`.  
**Evidencia:** auditoría Git 2026-11-14 (`git worktree list`, SHAs abajo).  
**Alcance:** documentación de etiquetas; **no** cambia rama canónica de producción ni políticas de deploy.  
**Commit relacionado:** `chore/opex-ai-agents-v1`

## SHAs verificados (local)
| Ref | SHA corto | Etiqueta sugerida |
| --- | --- | --- |
| `origin/main` / `main` | `0c189dd` | Producción publicada (merge PR #1) |
| `integration/v1-interactive-book` | `ad478aa` | Estado integrado (1ª edición + GOV docs) |
| `feature/page-01-ux-3d-02` | `cc5b168` | Base aprobada localmente (páginas 00–01) |
| `feature/page-02-system-3d-01` | `f88ddc2` | Experimental (página 02 commit); WIP aparte |
| `chore/opex-ai-agents-v1` | (este worktree) | Config multiagente (basada en `f88ddc2`) |

## Contradicción detectada
- `docs/PROJECT_STATE.md` y `.agents/rules/opex-engineering-governance.md` mandan partir siempre de `integration/v1-interactive-book`.
- El trabajo visual verificado de páginas 00–01 (`cc5b168`) y el experimento 02 (`f88ddc2`) **no** están en esa punta.
- Forzar `integration` como único origen **borraría contexto** de la 2ª edición visual.

## Corrección mínima (propuesta)
1. Mantener `integration/v1-interactive-book` / `main` como referencias de **producción / integrado 1ª edición**.
2. Tratar `cc5b168` como **base aprobada local** para continuidad visual 00–01.
3. Tratar `feature/page-02-system-3d-01` como **experimental**.
4. Usar worktrees aislados; no pisar WIP de página 02.
5. Actualizar `PROJECT_STATE.md` solo cuando el usuario apruebe un nuevo hito integrado (fuera de AI-TEAM-01).

## No hacer en esta tarea
- No reescribir la rama canónica de producción.
- No cambiar workflows de deploy/CI.
- No merge automático de 00–02 hacia `main`/`integration`.
