# Prueba de delegación — Página 02 (AI-TEAM-01)

**Fecha:** 2026-11-14  
**Estado:** BLOQUEADA (invocación de subagentes custom no disponible en esta sesión)  
**Motivo:** Validar que los cinco contratos producen informes distintos sobre página 02 **sin** modificar escenas.  
**Evidencia:** intento real de `Task` con `subagent_type: "opex-architect"` rechazado por el esquema.  
**Alcance:** solo configuración/orquestación.  
**Commit relacionado:** `chore/opex-ai-agents-v1`  
**Worktree de código página 02:** `E:\opexLider-wt\opex-ai-agents-v1` @ `f88ddc2` (WIP de personajes permanece en `page-02-system-3d-01` sin tocar).

## Intentos de invocación

| Agente | Canal | Resultado |
| --- | --- | --- |
| `opex-architect` | Cursor `Task` tool | **FAIL de plataforma:** `Invalid option: expected one of "generalPurpose"\|"explore"\|"cursor-guide"\|"ci-investigator"\|"bugbot"\|"security-review"\|"best-of-n-runner"` |
| `opex-pedagogy` | no invocado | Bloqueo previo (mismo esquema) |
| `opex-3d-art-director` | no invocado | Bloqueo previo |
| `opex-3d-engineer` | no invocado | Bloqueo previo |
| `opex-quality-security` | no invocado | Bloqueo previo |

## Archivos de contrato presentes (no ejecutados como subagentes)
- `.cursor/agents/opex-architect.md`
- `.cursor/agents/opex-pedagogy.md`
- `.cursor/agents/opex-3d-art-director.md`
- `.cursor/agents/opex-3d-engineer.md`
- `.cursor/agents/opex-quality-security.md`

## Condiciones observadas
1. En esta sesión de Agent Router, `Task.subagent_type` **solo** admite subagentes built-in; **no** enumera los custom de `.cursor/agents/`.
2. Por instrucción de misión: **no** se simularon informes ni se usó `generalPurpose` disfrazado de especialista.
3. Para reintentar: abrir `E:\opexLider-wt\opex-ai-agents-v1` como raíz del proyecto Cursor e invocar `/opex-architect` (y homólogos) en un Agent chat que soporte Subagents del producto; o esperar a que `Task` exponga los nombres custom.

## Informes de especialistas
**NO DISPONIBLE** — no hay informes inventados. Reintentar tras desbloqueo de plataforma.

## Alcance de la prueba prevista (para reintento)
1. Architect: estructura `src/lib/system3d/`
2. Pedagogy: PERSONAS y relación con el sistema (`SystemEducationalData.ts`)
3. Art Director: diagnóstico de humanoides procedurales + contrato visual de reemplazo
4. 3D Engineer: diseño técnico GLB **sin implementar**
5. Quality & Security: riesgos y criterios de aceptación
