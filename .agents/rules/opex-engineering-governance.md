---
trigger: always_on
---

# OPEX LÍDER — Gobierno de Ingeniería y Continuidad Permanente (GOV-01)

## 1. Fuente de Verdad y Verificación de Inicio de Sesión

- **Repositorio oficial:** `omar-fonseca/opex-lider`
- **Rama estable de producción (`RELEASE-01`):** `main` (`0c189dd` / `0c189ddc5989007dcec583509c37bd5daec6172b`)
- **Rama integrada vigente:** `integration/v1-interactive-book`
- **Worktree oficial de integración:** `C:\Users\ASUS\.gemini\antigravity\worktrees\opexLider\integration`
- **Estado de referencia documentado:** Consultar siempre `docs/PROJECT_STATE.md` al iniciar sesión.

### Protocolo obligatorio antes de iniciar cualquier tarea
Antes de modificar archivos, ejecutar servidores o proponer cambios en cada sesión:

1. **Identificar el directorio y worktree activos** (`Get-Location` y `git worktree list`).
2. **Comprobar estado local y remoto:** ejecutar `git status -sb`, `git rev-parse HEAD` y contrastar con la rama remota (`origin/integration/v1-interactive-book`).
3. **Verificar nuevos commits publicados:** comprobar si existen commits más recientes en el remoto antes de seleccionar el punto de partida.
4. **Confirmar la versión integrada y validada:** utilizar siempre la última versión integrada y validada en `integration/v1-interactive-book` (registrada en `docs/PROJECT_STATE.md`), no simplemente una rama aislada con fecha reciente ni un worktree experimental antiguo.
5. **Prohibición de acciones destructivas automáticas:** no cambiar de rama, no descartar modificaciones (`reset`, `checkout --`, `clean`), ni ejecutar `merge` o `rebase` automáticamente sin autorización explícita.
6. **Bloqueo ante worktree incorrecto:** si el IDE abre `refine_ui_ux_v2` u otro worktree antiguo como directorio activo, **detener cualquier implementación**, advertir inmediatamente al usuario e indicarle abrir `C:\Users\ASUS\.gemini\antigravity\worktrees\opexLider\integration` como carpeta de trabajo (o ejecutar los comandos apuntando explícitamente a dicho worktree tras confirmación).

---

## 2. Reglas Obligatorias de Ingeniería

En cada modificación de código se debe cumplir:

- **Arquitectura modular y alta cohesión:** mantener responsabilidades estrictamente separadas entre contenido editorial, lógica de dominio/cálculo (`src/lib/`), motores de interacción/presentación y componentes visuales (`src/components/`).
- **TypeScript tipado y mantenible:** escribir código TypeScript legible, con interfaces explícitas y sin `any` injustificados.
- **Reutilización sin duplicación:** reutilizar los motores existentes (`expandableCardEngine.ts`, `presentationEngine.ts`, `otifEngine.ts`, `bookManifest.ts`) y componentes compartidos; nunca duplicar implementaciones ni lógica de negocio.
- **Cero dependencias innecesarias:** no instalar paquetes externos sin justificación técnica previa y aprobación explícita.
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
- Verificar siempre la interfaz real en navegador (no únicamente el código de estado `HTTP 200`).
- Al cierre de cada entrega, reportar siempre:
  1. Archivos modificados.
  2. Pruebas y verificaciones realizadas.
  3. SHA local y estado de sincronización remota.
- Actualizar `docs/PROJECT_STATE.md` únicamente cuando se apruebe e integre un nuevo hito validado (nunca registrar versiones experimentales como aprobadas).
