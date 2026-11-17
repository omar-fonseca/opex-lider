# OPEX LÍDER — Estado Oficial del Proyecto (`PROJECT_STATE.md`)

**Última actualización:** 2026-11-17 — `REPOSITORY-HARDENING-02`
**Estado:** desarrollo consolidado; página 02 experimental. Esta actualización de contexto no aprueba visualmente la página 02 ni autoriza una publicación de producción.

---

## 1. Fuente de verdad y continuidad

- **Repositorio:** `https://github.com/omar-fonseca/opex-lider.git` (OPEX LÍDER — Interactive Digital Book).
- **Única carpeta habitual de desarrollo:** `E:\opexLider`.
- **Rama de desarrollo:** `feature/opex-dev-unified`; base consolidada de esta fase: `54922d6acf63f6593cd891f41eee0e3823bd75cc`.
- **Producción estable:** `main` en `0c189ddc5989007dcec583509c37bd5daec6172b`; no se modifica ni se fusiona automáticamente.
- **Estado Git vigente:** ejecutar `git status -sb`, `git rev-parse HEAD` y `git worktree list` desde la carpeta oficial. El HEAD puede avanzar con commits locales pequeños; no volver a una rama histórica por seguir un documento antiguo.
- **Respaldo remoto:** a la entrada de HARDENING-02 faltaban nueve commits de la rama consolidada y los históricos `032a31c`/`47337f5` en referencias remotas. La publicación y retirada local siguen condicionadas a verificar Cloudflare Workers Builds y los SHAs remotos. Consultar la entrega de la fase para resultados, sin asumir que se publicaron.

`integration/v1-interactive-book` conserva la primera edición integrada y documentación histórica; ya no es el punto de arranque del desarrollo visual. La documentación de esa época permanece en Git.

## 2. Worktrees y recuperación

Al inicio de HARDENING-02 Git registra:

- `E:\opexLider`: desarrollo consolidado.
- `C:\Users\ASUS\.gemini\antigravity\worktrees\opexLider\integration`: referencia histórica limpia en `ad478aa`.
- `C:\Users\ASUS\.gemini\antigravity\worktrees\opexLider\visual_3d_04_poc`: PoC aislado limpio en `47337f5`.

No abrir los worktrees históricos como workspace habitual ni crear otros. Su retirada requiere recuperación remota comprobada, inventario de ignorados y ausencia de uso activo. El backup existente `E:\opexLider-backups` se conserva hasta cumplir esas condiciones. `032a31c` mantiene la identidad histórica del WIP; sus cuatro archivos ya estaban incluidos en la consolidación `54922d6`.

---

## 3. Arquitectura Técnica Verificada

- **Stack base:** Astro `^7.4.2` (salida estática `output: "static"`) + TypeScript + HTML/CSS/SVG nativo. Cero dependencias de UI pesadas en el cliente.
- **Motores modulares en `src/lib/`:**
  - `src/lib/bookManifest.ts`: Manifiesto centralizado de las 10 páginas de la Primera Edición (`00–09`), metadatos de bloques, rutas y corpus de búsqueda (`Ctrl + K`).
  - `src/lib/expandableCardEngine.ts`: Motor de transiciones espaciales FLIP (*First, Last, Invert, Play*) con Web Animations API, iluminación escalonada de trazos SVG (`animateProgressiveConnections`), arrastre por *Pointer Events* y acoplamiento rápido (`makeCardDraggable`).
  - `src/lib/presentationEngine.ts`: Motor reutilizable de Modo Presentación Inmersivo (`EXP-01 v2.0`) con soporte para Fullscreen API, avance secuencial, *autoplay* pausable (`P`), vista general (`O`/`Home`), aislamiento de teclado y restauración exacta de foco/scroll.
  - `src/lib/otifEngine.ts`: Módulo puro de cálculo matemático del indicador OTIF (*On-Time In-Full*) sobre 200 pedidos semanales (`KPI-UX-01`), desacoplado del DOM.
- **Layout y componentes globales (`src/layouts/` y `src/components/book/`):**
  - `BaseLayout.astro`: Shell de lectura con persistencia en `localStorage` de tema (`dark` / `light`), paleta de acento (`blue` / `orange` / `red` / `green`), estado del índice lateral, progreso de lectura y marcadores.
  - `ReaderTopbar.astro`: Barra superior con migas de contexto, buscador, selector de tema, selector desplegable arcoíris de 4 paletas (`UI-01.1`) y botón de marcador.
  - `BookNav.astro`, `ReaderFooter.astro`, `SearchModal.astro`: Navegación lateral por bloques, pie de avance entre capítulos y modal de búsqueda instantánea.
- **Sistema de estilos (`src/styles/`):**
  - `global.css`: Tokens de diseño, variables de las 4 paletas de acento en modo oscuro y claro, tipografía editorial equilibrada (`text-wrap: balance`) y estilos de las páginas `00–02`.
  - `pages-03-09.css`: Estilos de bancos de trabajo interactivos (`.expandable-workbench`), tarjetas expandibles FLIP, modo presentación inmersivo (`EXP-01 v2.0`) y adaptaciones responsive.

---

## 4. Funcionalidades Existentes por Página (Páginas `00–09`)

| Página | Ruta | Componente principal | Estado de referencia; madurez vigente en `docs/ai/PAGE_STATUS_00_19.md` |
| :--- | :--- | :--- | :--- |
| **00 · Cubierta** | `/` | `Constellation.astro` | Cubierta aprobada con siete engranajes 3D sincronizados, seis conceptos, tarjetas FLIP y fallback; congelada. |
| **01 · Excelencia operacional** | `/introduccion` | `introduccion.astro` | Cuatro tarjetas editoriales 3D, ilustraciones contextuales y modo auditorio; aprobada y congelada. |
| **02 · Sistema interactivo** | `/sistema` | `InteractiveSystem.astro` | Escena 3D experimental de cuatro fuerzas y nexo central, relatos GSAP, modo presentación y fallback 2D. HARDENING-02 estabiliza estado/pausa/URL; la evolución artística de personajes sigue pendiente. |
| **03 · El líder en el proceso** | `/lider-proceso` | `LeaderProcessMap.astro` | **Modernizado (`EXP-01 v2.0`):** Mapa 2.5D del Gemba con recorrido secuencial animado, **Modo Presentación Inmersivo (`🖥️ Presentar`)**, teleprompter lateral, barra HUD inferior, revelados ASCII y tarjeta FLIP desplazable con micro-diagrama SVG. |
| **04 · Anatomía de un proceso** | `/anatomia-proceso` | `ProcessAnatomyFlow.astro` | Flujo interactivo de 5 etapas (*Entrada, Actividades, Transformación, Salida, Retroalimentación*) con aproximación de cámara SVG, pulso viajero y tarjeta FLIP con subdiagrama vectorial. |
| **05 · Gestión visual** | `/gestion-visual` | `VisualManagementBoard.astro` | Tablero físico realista de piso (bastidor 2.5D) con 5 zonas clicables (`Z1–Z5`), pulso horario, matriz SQDC, semáforos y tarjeta técnica FLIP desplazable (`#vm-inspector`). |
| **06 · Kanban: concepto y señal** | `/kanban-concepto` | `KanbanPullSystem.astro` | Circuito cerrado de señal Pull de 4 momentos (*Consumo real, Señal Kanban, Producción sincronizada, Físico vs. Flujo*) con tarjeta explicativa FLIP (`#kb-inspector`). |
| **07 · Tablero Kanban y flujo** | `/kanban-flujo` | `KanbanWipSimulator.astro` | **Modernizado (`EDU-UX-02`):** Tablero físico digital 2.8D para pedido de `1.000 barras (20 lotes de 50)`, notas adhesivas físicas con textura de papel y chincheta, vuelo espacial parabólico FLIP entre columnas, control estricto **WIP `2 / 2 MÁX`**, inspector expandible FLIP de lote, bandeja flotante de archivo (`📁 Archivo`) y rigor metodológico de 4 tarjetas. |
| **08 · KPI: medir lo importante** | `/kpi-concepto` | `KpiAlignmentTree.astro` | **Modernizado (`KPI-UX-01.1`):** Franja superior compacta de telemetría con **simulador interactivo OTIF en tiempo real** (*slider* `140–200` pedidos y *presets* `183`, `192`, `200`), sincronizado en vivo con el **Árbol SVG Hero** de 5 niveles y su ficha técnica `[01–05]`. |
| **09 · KPI en la gestión diaria** | `/kpi-gestion-diaria` | `DailyKpiRoutineFlow.astro` | Flujo de 5 pasos de rutina diaria (*Observar KPI, Detectar desvío, Verificar en Gemba, Coordinar acción, Seguimiento*) separando plano del tablero y plano del terreno, con tarjeta FLIP (`#dk-inspector`) y síntesis de cierre de la edición. |

---

## 5. Defectos Conocidos y Mejoras Pendientes (Backlog Priorizado)

### 5.1 Mejoras visuales y de interacción en cartas gráficas (Páginas `04, 06 y 09`)
1. **Asimetría de madurez visual en las cartas gráficas de las Páginas `04`, `06` y `09`:**
   - Mientras las páginas `03, 05, 07 y 08` cuentan con tableros 2.5D, telemetría en vivo o modo presentación, las páginas `04` (`ProcessAnatomyFlow.astro`), `06` (`KanbanPullSystem.astro`) y `09` (`DailyKpiRoutineFlow.astro`) aún utilizan lienzos SVG de cajas rectangulares de primera generación y cartas con tiras de texto (`.expanded-flow-strip`).
   - **Acción recomendada:** Enriquecer las cartas gráficas de `06` y `09` con esquemas visuales propios (ficha física de tarjeta Kanban en `06`; desglose visual de los 9 pedidos desviados y matriz *Contención vs. Causa Raíz* conectada a `otifEngine.ts` en `09`) y elevar la riqueza visual de sus diagramas principales.
2. **Unificación de tarjetas desplazables (`makeCardDraggable`) en Páginas `04, 06, 08 y 09`:**
   - En `integration/v1-interactive-book`, `makeCardDraggable()` está activo en las páginas `00, 02, 03 y 05`, pero aún no se ha conectado a las cartas expandibles de las páginas `04, 06, 08 y 09`.
3. **Extensión progresiva del Modo Presentación Inmersivo (`presentationEngine.ts`):**
   - Evaluar la incorporación del controlador `createPresentationController` en los diagramas de las páginas `04, 05, 06, 08 y 09` para ofrecer la misma experiencia de proyección en reuniones que ya tiene la Página `03`.

### 5.2 Estabilidad técnica y UX en transiciones
4. **Selección directa de otro nodo en el lienzo cuando una carta está abierta:**
   - En los bancos de trabajo que utilizan `.expandable-scrim` (`03, 04, 06, 08, 09`), el velo cubre el lienzo con `z-index: 10`, por lo que hacer clic sobre otro nodo del SVG mientras la carta está abierta cierra primero la carta en lugar de conmutar directamente al nodo clicado.
5. **Protección ante cierre/reapertura ultrarrápida en `expandableCardEngine.ts`:**
   - El motor ya cancela cierres pendientes mediante un registro por tarjeta. Página 02 debe además cancelar callbacks de vista obsoletos al cerrar/reabrir; esa secuencia forma parte de las regresiones de HARDENING-02. No volver a implementar un segundo motor FLIP.
6. **Atajo global de flechas (`ArrowLeft` / `ArrowRight`) en `BaseLayout.astro`:**
   - Asegurar que pulsar las flechas del teclado mientras una tarjeta modal (`[data-expanded="true"]`) está abierta o cuando el foco reside en un nodo SVG (`role="button"`) no dispare la navegación al capítulo anterior/siguiente del libro.

---

## 6. Retomar desde Cursor, Antigravity o VS Code

Abrir únicamente `E:\opexLider`, verificar rama/HEAD/estado/worktrees/remotos y leer este estado, `AGENTS.md`, `.agents/rules/` y `docs/ai/README.md`. No crear worktrees para continuar esta fase.

```powershell
Set-Location E:\opexLider
git status -sb
git rev-parse HEAD
git worktree list
npm run dev -- --background --host 127.0.0.1
```

Controlar con `npm run astro -- dev status`, `npm run astro -- dev logs` y `npm run astro -- dev stop`. Para validar: build, npm test, Playwright, npm audit y diff --check. Playwright gestiona un servidor de preview propio y no reutiliza un servidor ajeno.

Los informes y ADR históricos no autorizan cambiar a carpetas anteriores. Los resultados de cada fase deben identificarse mediante su SHA; no equivalen a aprobación visual ni a publicación en producción.
