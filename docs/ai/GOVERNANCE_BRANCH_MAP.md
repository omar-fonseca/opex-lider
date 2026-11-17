# Mapa operativo de ramas y recuperación

**Fecha:** 2026-11-17 · HARDENING-02. Estado canónico: `../PROJECT_STATE.md`.

| Referencia | Base verificada al iniciar | Uso |
| --- | --- | --- |
| `main` / `origin/main` | `0c189ddc5989007dcec583509c37bd5daec6172b` | Producción estable; no modificar |
| `feature/opex-dev-unified` | `54922d6acf63f6593cd891f41eee0e3823bd75cc` | Desarrollo habitual en `E:\opexLider`; avanza con los commits de esta fase |
| `integration/v1-interactive-book` | `ad478aaaa1aed03dcc3f9afb2b72be4aaa4288ce` | Primera edición/documentación histórica; ya remota |
| `feature/page-01-ux-3d-02` | `cc5b168e429c45369b1d33a39a4c8cfd57f9dc10` | Base aprobada 00/01; incluida en unified |
| `feature/page-02-system-3d-01` | `032a31ce70b05b1e519935251bfe6c35dd9e9101` | WIP histórico: contenido integrado, commit exclusivo por preservar |
| `exp/visual-3d-04-poc` | `47337f5a4367ccab50ad69de60e09182f2a8446a` | Experimento independiente con código único; no integrar automáticamente |
| `backup/initial-three-pages` | `3bfb5bdac39d624a2388829262b0f6670e9148c2` | Respaldo histórico ya remoto; conservar |

## Reglas operativas

- Abrir `E:\opexLider`; verificar `git status -sb`, `git rev-parse HEAD`, `git branch -avv`, `git worktree list` y `git ls-remote --heads --tags origin`.
- No volver a `integration`, `refine_ui_ux_v2` ni carpetas antiguas para desarrollar la segunda edición.
- Conservar `main` y `feature/opex-dev-unified`. No retirar referencias exclusivas hasta verificar su recuperación remota.
- Para preservar historia exclusiva, proponer/publicar las referencias de archivo autorizadas desde los SHAs exactos; verificar cada una con `ls-remote`. No usar force ni mirror.
- Todo push, incluidas referencias de archivo, requiere controles de secretos y de disparadores de Cloudflare Workers Builds. No publicar si esos disparadores no se pueden comprobar; no confundir CI con despliegue.
- Los worktrees históricos limpios no son workspaces habituales. Su retirada está condicionada a respaldo remoto, revisión de ignorados y ausencia de uso; no asumir que se retiraron por estar documentados aquí.

Los mapas de 2026-11-14 quedan en el historial Git y los informes fechados. No contradicen este procedimiento vigente.
