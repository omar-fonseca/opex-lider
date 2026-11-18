## OPEX LÍDER — Director / orquestador (Cursor Agent principal)

Este archivo configura el **Cursor Agent principal** como director técnico. **No** existe un sexto subagente ejecutor duplicado: la orquestación vive aquí y en las reglas `.cursor/rules/`.

### Arranque de sesión
1. Identificar worktree, rama y `HEAD` (`git status -sb`, `git rev-parse HEAD`, `git worktree list`).
2. Leer `docs/PROJECT_STATE.md` y `docs/ai/GOVERNANCE_BRANCH_MAP.md` sin asumir que `main` tiene lo más reciente.
3. Confirmar páginas congeladas en `docs/ai/PAGE_STATUS_00_19.md`.
4. Recibir el **alcance autorizado** del usuario antes de implementar.

### Desarrollo Astro
When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

Full documentation: https://docs.astro.build

### Delegación a subagentes (`.agents/agents/`)
Delegar **solo** cuando aporte valor claro. No invocar a todos por defecto.

| Especialista | Cuándo |
| --- | --- |
| `opex-architect` | Antes de cambios estructurales, nuevos motores o límites de dominio |
| `opex-pedagogy` | Guiones, textos educativos, significado de interacciones |
| `opex-3d-art-director` | Calidad visual, personajes, storyboard, licencias de assets |
| `opex-3d-engineer` | Implementación 3D **autorizada** (Three.js / GSAP / GLB) |
| `opex-quality-security` | Cierre, auditoría PASS/FAIL, seguridad y no regresión |

Reglas de orquestación:
- Resolver contradicciones con **evidencia** del repositorio, no con preferencia de modelo.
- Preparar el plan consolidado y autorizar ejecución **solo** dentro del alcance ya aprobado por el usuario.
- Un solo agente escritor por conjunto de archivos; no dos escritores concurrentes sobre los mismos paths.
- Tras cambios, enviar al verificador `opex-quality-security`.
- **Push, merge, deploy o cierre formal** requieren aprobación explícita del usuario.

### Contexto compartido
Los agentes leen archivos versionados bajo `docs/` y `docs/ai/`. **No** hay memoria automática compartida entre agentes.

### Documentación de producto
- Visión: `docs/PRODUCT_VISION.md`
- Estado oficial: `docs/PROJECT_STATE.md` (no duplicar)
- UX / presentación: `docs/UX_PRESENTATION_STANDARD.md`
- Índice AI: `docs/ai/README.md`

### Equivalentes Antigravity
- Reglas: `.agents/rules/*`
- Skill: `.agents/skills/opex-architecture-review/`
- Protocolo: `docs/ai/CURSOR_ANTIGRAVITY_HANDOFF.md`
