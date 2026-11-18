---
trigger: always_on
---

# OPEX LÍDER — Gobierno de Ingeniería y Continuidad Permanente (GOV-01)

> **Actualización 2026-11-17 — HARDENING-02:** `docs/PROJECT_STATE.md` es el estado canónico. `integration/v1-interactive-book` es una referencia histórica de la primera edición; el desarrollo continúa en la rama consolidada, sin cambiar producción.

## 1. Fuente de verdad y arranque de sesión

- Repositorio: `omar-fonseca/opex-lider`.
- Carpeta oficial habitual: `E:\opexLider`.
- Rama de desarrollo: `feature/opex-dev-unified`; producción estable: `main`.
- Leer `docs/PROJECT_STATE.md` y `docs/ai/GOVERNANCE_BRANCH_MAP.md`; verificar ubicación, rama, HEAD, estado, worktrees y remotos antes de modificar o iniciar servidores.
- Consultar el remoto antes de publicar; no asumir respaldo por la existencia de un tracking ref local.
- No crear otros repositorios/worktrees ni seguir rutas históricas de informes como instrucciones operativas. Si el IDE abre otra carpeta, ejecutar las tareas autorizadas apuntando explícitamente a la carpeta oficial.
- No descartar WIP, ejecutar reset destructivo ni clean forzado, cambiar de rama, reescribir historia, fusionar ni desplegar sin autorización explícita del usuario. Un bloqueo de publicación no impide continuar correcciones locales independientes y reversibles dentro del alcance.
- Retirar worktrees/ramas/backups solo tras verificar referencias remotas recuperables y ausencia de archivos únicos o uso activo.
- **Alcance autorizado y páginas congeladas:** trabajar estrictamente dentro del alcance autorizado por el usuario. Consultar y respetar la política de congelación en `docs/ai/PAGE_STATUS_00_19.md` y `docs/ai/APPROVAL_AND_FREEZE_POLICY.md`; prohibido modificar páginas 00–19 o escenas 3D salvo autorización explícita por página.

---

## 2. Reglas Obligatorias de Ingeniería

En cada modificación de código se debe cumplir:

- **Arquitectura modular y alta cohesión:** mantener responsabilidades estrictamente separadas entre contenido editorial, lógica de dominio/cálculo (`src/lib/`), motores de interacción/presentación y componentes visuales (`src/components/`).
- **TypeScript tipado y mantenible:** escribir código TypeScript legible, con interfaces explícitas y sin `any` injustificados.
- **Reutilización sin duplicación:** reutilizar los motores existentes (`expandableCardEngine.ts`, `presentationEngine.ts`, `otifEngine.ts`, `bookManifest.ts`) y componentes compartidos; nunca duplicar implementaciones ni lógica de negocio.
- **Cero dependencias y assets innecesarios:** no instalar paquetes externos ni descargar assets (modelos 3D, binarios, fuentes) sin justificación técnica previa y aprobación explícita del usuario.
- **Seguridad, accesibilidad y rendimiento desde el diseño:**
  - Cumplir navegación por teclado (`Tab`, `Enter`, `Escape`, flechas), atributos ARIA, gestión de foco y soporte para `prefers-reduced-motion: reduce`.
  - Evitar fugas de memoria o acumulación de *event listeners* globales.
- **Compatibilidad visual completa:** toda interfaz o diagrama debe funcionar y contrastar correctamente en las **cuatro paletas de acento** (`blue`, `orange`, `red`, `green`) y en **ambos temas** (`dark` y `light`).
- **Preservación de la experiencia editorial:** respetar la navegación del libro, las transiciones espaciales FLIP y las reglas tipográficas de `.agents/rules/opex-editorial-typography.md` y `.agents/rules/opex-project-identity.md`.

---

## 3. Tratamiento del Código Obsoleto

No acumular indefinidamente implementaciones experimentales o código muerto. Antes de retirar cualquier fragmento, función, estilo o componente:

1. Identificar todas sus referencias y consumidores en el proyecto.
2. Confirmar con evidencia que está realmente obsoleto.
3. Evaluar el impacto visual, funcional y arquitectónico de retirarlo.
4. Ejecutar el *build* y las pruebas pertinentes.
5. Eliminarlo de forma controlada mediante un commit atómico y reversible.

Quedan prohibidas las eliminaciones masivas o refactorizaciones ajenas al alcance de la tarea activa.

---

## 4. Flujo de Entrega y Control de Versiones

Cada incremento de ingeniería debe seguir rigurosamente la secuencia:

**Requisitos → Diseño → Implementación → Pruebas → Revisión → Limpieza → Commit → Push**

- Publicar los incrementos validados en su rama correspondiente.
- **No fusionar con `main`** sin autorización expresa del usuario y validación completa de la integración.
- **Orquestación y concurrencia:** el Agent principal actúa como director técnico (`AGENTS.md`). Mantener un solo agente o proceso escritor a la vez por conjunto de archivos; usar modo de solo lectura (readonly) para auditorías e inspecciones. Delegar a `.agents/agents/*` solo cuando aporte valor claro.
- **Rigor en pruebas y verificación:** verificar siempre la interfaz real en navegador (no únicamente el código `HTTP 200`). Prohibido inventar resultados de pruebas o de build: ejecutar los comandos reales o marcar como `NO DISPONIBLE` con evidencia comprobable.
- **Autorización de cierre:** el cierre formal de tareas, commits, push, merge o deploy requiere siempre la aprobación explícita del usuario.
- Al cierre de cada entrega, reportar siempre:
  1. Archivos modificados.
  2. Pruebas y verificaciones realizadas.
  3. SHA local y estado de sincronización remota.
- Actualizar `docs/PROJECT_STATE.md` ante un hito validado o una corrección de contexto/rutas expresamente autorizada. Nunca registrar una página experimental como aprobada ni declarar respaldo remoto sin verificarlo.
