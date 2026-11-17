# Protocolo de transferencia Cursor ↔ Antigravity

**Fecha:** 2026-11-17
**Estado:** activo
**Motivo:** Cursor, Antigravity y VS Code continúan sobre la misma carpeta oficial, sin crear copias ni worktrees.
**Evidencia:** `docs/PROJECT_STATE.md` y `GOVERNANCE_BRANCH_MAP.md`; comprobar siempre Git al retomar.
**Alcance:** handoff operativo.
**Commit relacionado:** `chore/opex-ai-agents-v1`

## Principios
1. La verdad está en **Git + docs versionados**, no en la memoria del chat.
2. Única carpeta habitual: `E:\opexLider`, rama `feature/opex-dev-unified`; un escritor por archivo.
3. No editar el mismo archivo desde dos IDEs a la vez.

## Checklist de handoff
1. `git status -sb` y `git rev-parse HEAD` en el worktree de origen.
2. Listar archivos dirty; no dejar WIP sin documentar.
3. Actualizar o citar `docs/ai/PAGE_STATUS_00_19.md` / informe en `docs/ai/reports/`.
4. En destino: abrir la misma carpeta oficial, comprobar rama/HEAD y cambios pendientes; consultar remotos sin cambiar de rama automáticamente.
5. Releer `AGENTS.md`, `.agents/rules/*` y la Skill portable pertinente en `.agents/skills/`; usar adaptadores mínimos del IDE.
6. Confirmar páginas 00/01 congeladas y página 02 experimental. Su WIP histórico ya está en la consolidación; conservar referencias de recuperación pendientes de respaldo.

## Mapa de agentes
| Cursor (`.cursor/agents/`) | Antigravity |
| --- | --- |
| `opex-architect` | Skill `opex-architecture-review` (equivalente; no duplicar lógica divergente) |
| `opex-pedagogy` / art / engineer / quality | Sin subagentes homónimos al 2026-11-14; usar reglas `.agents/rules` |
| Director | Chat principal + GOV-01 |

## Prohibido en handoff
Push/merge/deploy automáticos; reset destructivo; asumir que `integration` incluye 00–02 3D.
