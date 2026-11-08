# OPEX LÍDER — Estado Oficial del Proyecto (`PROJECT_STATE.md`)

**Última actualización:** 2026-11-07 (Directiva `RELEASE-01 / Fase 2`)
**Estado:** Release Candidate verificada con CI y cabeceras Cloudflare (`RELEASE-01`)

---

## 1. Fuente de Verdad Actual

| Parámetro | Valor oficial verificado |
| :--- | :--- |
| **Repositorio remoto** | `omar-fonseca/opex-lider` (`https://github.com/omar-fonseca/opex-lider.git`) |
| **Rama integrada vigente** | `integration/v1-interactive-book` |
| **Commit Kanban 2.8D integrado (`EDU-UX-02`)** | `fa3e035` (`fa3e035df8a5658055e2a1cb3b1a3403189270f1`) |
| **Worktree oficial de referencia** | `C:\Users\ASUS\.gemini\antigravity\worktrees\opexLider\integration` |
| **Último hito validado** | `RELEASE-01 / Fase 2` — Integración de `EDU-UX-02` (Kanban 2.8D), correcciones de estabilidad en `KpiAlignmentTree.astro` y `BaseLayout.astro`, suite de pruebas `node:test`, pipeline CI en `.github/workflows/ci.yml` y cabeceras `public/_headers` con CSP por hash SHA-256 |

> [!IMPORTANT]
> No utilizar `refine_ui_ux_v2` (`966083d`) ni ramas de funcionalidades aisladas ya fusionadas como punto de partida para nuevos desarrollos. Todo trabajo de integración parte de `C:\Users\ASUS\.gemini\antigravity\worktrees\opexLider\integration` en la rama `integration/v1-interactive-book`.

---

## 2. Mapa de Worktrees en el Entorno Local

| Worktree | Rama asociada | Commit | Rol actual |
| :--- | :--- | :--- | :--- |
| `C:\Users\ASUS\.gemini\antigravity\worktrees\opexLider\integration` | `integration/v1-interactive-book` | `d8b5dec` ( + commit `GOV-01`) | **Worktree principal activo (Fuente de verdad integrada)** |
| `E:\opexLider` | `feature/exp-01-presentation-mode` | `0ee088c` | Rama de funcionalidad ya integrada en `INT-01` |
| `C:\Users\ASUS\.gemini\antigravity\worktrees\opexLider\kanban` | `feature/edu-ux-01-kanban` | `a61273b` | Rama de funcionalidad ya integrada en `INT-01` |
| `C:\Users\ASUS\.gemini\antigravity\worktrees\opexLider\kpi` | `feature/kpi-ux-01` | `fdd2958` | Rama de funcionalidad ya integrada en `INT-01` |
| `C:\Users\ASUS\.gemini\antigravity\worktrees\opexLider\refine_ui_ux_v2` | `refine_ui_ux_v2` | `966083d` | Base histórica inicial de 10 páginas (**obsoleta para nuevas mejoras**) |

---

## 3. Arquitectura Técnica Verificada

- **Stack base:** Astro `^6.1.3` (salida estática `output: "static"`) + TypeScript + HTML/CSS/SVG nativo. Cero dependencias de UI pesadas en el cliente.
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

| Página | Ruta | Componente principal | Estado funcional verificado en `integration/v1-interactive-book` |
| :--- | :--- | :--- | :--- |
| **00 · Cubierta** | `/` | `Constellation.astro` | Órbita interactiva de 6 nodos conceptuales con conexiones relacionales, transición FLIP hacia ficha conceptual (`#node-insight`) y soporte de arrastre/acoplamiento en escritorio. |
| **01 · Excelencia operacional** | `/introduccion` | `introduccion.astro` | Capítulo editorial de fundamentación (4 bloques de lectura, caso breve comparativo, cita clave y puente hacia el sistema interactivo). |
| **02 · Sistema interactivo** | `/sistema` | `InteractiveSystem.astro` | Escenario 2.5D de las 4 fuerzas (*Personas, Procesos, Liderazgo, Mejora*), modo enfoque, conexiones progresivas y tarjeta expandible desplazable (`#system-card-panel`). |
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
   - Si el usuario cierra una tarjeta y vuelve a abrir un nodo antes de que transcurran los `~290 ms` de `animateFlipClose`, el temporizador de limpieza del cierre puede solaparse con la nueva apertura. Conviene cancelar cualquier cierre pendiente mediante un registro por tarjeta (`WeakMap`).
6. **Atajo global de flechas (`ArrowLeft` / `ArrowRight`) en `BaseLayout.astro`:**
   - Asegurar que pulsar las flechas del teclado mientras una tarjeta modal (`[data-expanded="true"]`) está abierta o cuando el foco reside en un nodo SVG (`role="button"`) no dispare la navegación al capítulo anterior/siguiente del libro.

---

## 6. Procedimiento Estándar para Retomar el Desarrollo

Al iniciar cualquier nueva sesión en Antigravity:

1. **Verificar carpeta y worktree activos:**
   ```powershell
   Set-Location "C:\Users\ASUS\.gemini\antigravity\worktrees\opexLider\integration"
   git status -sb
   git rev-parse --short HEAD
   git log -1 --oneline
   ```
   *(Nota sobre Antigravity IDE: el workspace predeterminado de una ventana depende de la carpeta abierta en el IDE. Si Antigravity abre `refine_ui_ux_v2` u otra carpeta por defecto, usar `File -> Open Folder...` y seleccionar `C:\Users\ASUS\.gemini\antigravity\worktrees\opexLider\integration`).*
2. **Verificar que no existan servidores antiguos en conflicto en los puertos `4321`, `4324` o `4328`:**
   ```powershell
   Get-NetTCPConnection -LocalPort 4321, 4324, 4328 -State Listen -ErrorAction SilentlyContinue
   ```
3. **Levantar el servidor de desarrollo desde el worktree `integration`:**
   ```powershell
   Set-Location "C:\Users\ASUS\.gemini\antigravity\worktrees\opexLider\integration"
   npm run dev -- --port 4321
   ```
4. **Comprobar en navegador (`http://localhost:4321/`)** la presencia del selector de 4 paletas y las experiencias integradas antes de crear una rama de trabajo o iniciar un nuevo incremento.
