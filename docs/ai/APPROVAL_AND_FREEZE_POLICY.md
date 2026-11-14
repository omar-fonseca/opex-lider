# Política de aprobación y congelación

**Fecha:** 2026-11-14  
**Estado:** activo  
**Motivo:** Separar diseño, implementación y cierre.  
**Evidencia:** DoD en `docs/UX_PRESENTATION_STANDARD.md` §E; GOV-01 flujo de entrega.  
**Alcance:** proceso de agentes y humanos.  
**Commit relacionado:** `chore/opex-ai-agents-v1`

## Niveles
1. **Diseño** — informes readonly (architect / pedagogy / art-director).
2. **Implementación autorizada** — alcance escrito por el usuario; un escritor (`opex-3d-engineer` u Agent principal).
3. **Verificación** — `opex-quality-security` con tabla PASS/FAIL/NO DISPONIBLE.
4. **Congelación** — página marcada bloqueada en `PAGE_STATUS_00_19.md` tras OK del usuario.
5. **Publicación** — push / merge / deploy solo con OK explícito.

## Freeze
- Páginas 00 y 01: tratadas como **bloqueadas** respecto a regresiones visuales/editoriales.
- Página 02: **experimental**; no declarar congelada; no pisar WIP de otros worktrees.
- Cambios de CSP/Cloudflare: autorización explícita aparte.

## Definition of Done (resumen)
Cumplir los 8 puntos de `UX_PRESENTATION_STANDARD.md` §E antes de pedir cierre.
