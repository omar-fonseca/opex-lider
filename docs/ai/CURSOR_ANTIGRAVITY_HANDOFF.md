# Protocolo de transferencia Cursor ↔ Antigravity

**Fecha:** 2026-11-14  
**Estado:** activo  
**Motivo:** Ambos entornos comparten el mismo Git con worktrees distintos.  
**Evidencia:** worktrees bajo `E:\opexLider*`, `C:\Users\ASUS\.gemini\antigravity\worktrees\opexLider\*`.  
**Alcance:** handoff operativo.  
**Commit relacionado:** `chore/opex-ai-agents-v1`

## Principios
1. La verdad está en **Git + docs versionados**, no en la memoria del chat.
2. Un worktree / una rama activa por línea de trabajo.
3. No editar el mismo archivo desde dos IDEs a la vez.

## Checklist de handoff
1. `git status -sb` y `git rev-parse HEAD` en el worktree de origen.
2. Listar archivos dirty; no dejar WIP sin documentar.
3. Actualizar o citar `docs/ai/PAGE_STATUS_00_19.md` / informe en `docs/ai/reports/`.
4. En destino: `git fetch` local vía worktree list; checkout de la rama acordada.
5. Releer `AGENTS.md` (Cursor) o `.agents/rules/*` (Antigravity).
6. Confirmar que no se pisa el WIP de `feature/page-02-system-3d-01`.

## Mapa de agentes
| Cursor (`.cursor/agents/`) | Antigravity |
| --- | --- |
| `opex-architect` | Skill `opex-architecture-review` (equivalente; no duplicar lógica divergente) |
| `opex-pedagogy` / art / engineer / quality | Sin subagentes homónimos al 2026-11-14; usar reglas `.agents/rules` |
| Director | Chat principal + GOV-01 |

## Prohibido en handoff
Push/merge/deploy automáticos; reset destructivo; asumir que `integration` incluye 00–02 3D.
