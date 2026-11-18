# OPEX LÍDER — Interactive Digital Book

**Interactive Digital Book de liderazgo y excelencia operacional.**
Concepción y diseño digital por **Omar Yesid Fonseca**.

---

## 1. Propósito y Naturaleza del Producto

**OPEX LÍDER** es un *Interactive Digital Book* en español diseñado para líderes, supervisores, coordinadores y dueños de proceso en manufactura, logística, mantenimiento y servicios.

Combina lectura editorial concisa, diagramas interactivos 2.5D/2.8D, escenas tridimensionales en tiempo real, simuladores operacionales y un modo de presentación inmersivo para facilitar tanto el estudio individual como la facilitación de sesiones en terreno (*Gemba*).

### Límites del producto
- Es una **aplicación web estática interactiva** (`output: "static"`).
- **No** es un SaaS, LMS, ERP, dashboard corporativo ni plataforma con backend, autenticación o base de datos.

---

## 2. Stack Tecnológico Real

| Capa | Tecnología verificada (`package.json`) |
| :--- | :--- |
| **Generador / Framework** | Astro `^7.4.2` (compilación estática en `dist/`) |
| **Lenguaje** | TypeScript (módulos ES, tipado explícito) |
| **Renderizado 3D y Animación** | Three.js `0.187.0` (`@types/three` `0.187.0`), GSAP `3.15.1`, Web Animations API (transiciones FLIP), HTML5, CSS y SVG nativo |
| **Pruebas Automatizadas** | Node.js Test Runner (`node --test`) y Playwright `1.65.0` (`@playwright/test`) |
| **Entorno de Ejecución** | Node.js `>=22.23.4` (Node `24` en CI) |

---

## 3. Estructura del Repositorio

```text
E:\opexLider\
├── .agents/
│   ├── agents/                 # 5 subagentes especializados de Antigravity
│   ├── rules/                  # 4 reglas normativas (2 always_on + 2 glob)
│   └── skills/                 # Skill canónica opex-architecture-review
├── .github/workflows/
│   └── ci.yml                  # Gate de calidad, seguridad, build y Playwright
├── docs/
│   ├── ai/                     # Índices AI, límites de arquitectura, estado de páginas y ADRs
│   ├── PRODUCT_VISION.md       # Visión y alcance autoritativo del producto
│   ├── PROJECT_STATE.md        # Estado oficial y continuidad de ingeniería
│   ├── TECH_ARCHITECTURE.md    # Arquitectura técnica base
│   └── UX_PRESENTATION_STANDARD.md
├── public/
│   ├── _headers                # Políticas de seguridad y CSP (hash SHA-256 exacto)
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── book/               # Navegación lateral, barra superior, pie y buscador (Ctrl+K)
│   │   └── diagrams/           # Componentes interactivos y escenas 2.5D / 3D por página
│   ├── layouts/
│   │   └── BaseLayout.astro    # Shell de lectura (4 paletas × 2 temas, progreso y marcadores)
│   ├── lib/
│   │   ├── gears3d/            # Motor 3D de 7 engranajes sincronizados (Página 00)
│   │   ├── system3d/           # Motor 3D de las 4 fuerzas y nexo central (Página 02)
│   │   ├── bookManifest.ts     # Manifiesto de rutas, metadatos y corpus de búsqueda
│   │   ├── expandableCardEngine.ts # Motor de tarjetas expandibles FLIP y arrastre
│   │   ├── otifEngine.ts       # Motor matemático puro del indicador OTIF (200 pedidos)
│   │   └── presentationEngine.ts   # Motor de Modo Presentación Inmersivo (Fullscreen / HUD)
│   ├── pages/                  # Rutas estáticas de la Edición 01 (Páginas 00 a 09)
│   └── styles/                 # Estilos globales, paletas de acento y hojas 3D dedicadas
├── tests/                      # Verificación estática/unitaria y pruebas E2E Playwright
├── AGENTS.md                   # Orquestador raíz y protocolo de delegación
├── astro.config.mjs
├── package.json
├── playwright.config.ts
└── tsconfig.json
```

---

## 4. Mapa de Páginas y Rutas (Edición 01: `00–09`)

| Pág. | Ruta | Archivo de página | Componente principal | Estado |
| :---: | :--- | :--- | :--- | :--- |
| **00** | `/` | `src/pages/index.astro` | `Constellation.astro` | **Congelada** (Aprobada) |
| **01** | `/introduccion` | `src/pages/introduccion.astro` | `IntroOperationalCards3D.astro` | **Congelada** (Aprobada) |
| **02** | `/sistema` | `src/pages/sistema.astro` | `InteractiveSystem.astro` | **Experimental** (3D en evolución) |
| **03** | `/lider-proceso` | `src/pages/lider-proceso.astro` | `LeaderProcessMap.astro` | Activa (`EXP-01 v2.0`) |
| **04** | `/anatomia-proceso` | `src/pages/anatomia-proceso.astro` | `ProcessAnatomyFlow.astro` | Activa |
| **05** | `/gestion-visual` | `src/pages/gestion-visual.astro` | `VisualManagementBoard.astro` | Activa |
| **06** | `/kanban-concepto` | `src/pages/kanban-concepto.astro` | `KanbanPullSystem.astro` | Activa |
| **07** | `/kanban-flujo` | `src/pages/kanban-flujo.astro` | `KanbanWipSimulator.astro` | Activa (`EDU-UX-02`) |
| **08** | `/kpi-concepto` | `src/pages/kpi-concepto.astro` | `KpiAlignmentTree.astro` | Activa (`KPI-UX-01.1`) |
| **09** | `/kpi-gestion-diaria` | `src/pages/kpi-gestion-diaria.astro` | `DailyKpiRoutineFlow.astro` | Activa |

Consulta el detalle de madurez y restricciones por capítulo en [`docs/ai/PAGE_STATUS_00_19.md`](docs/ai/PAGE_STATUS_00_19.md).

---

## 5. Requisitos, Instalación y Comandos

### Requisitos previos
- **Node.js** `>=22.23.4`
- **npm** (incluido con Node.js)

### Instalación
```powershell
npm ci
```

### Comandos de desarrollo, compilación y validación
| Comando | Acción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo de Astro en `http://localhost:4321`. |
| `npm run astro -- dev --background` | Inicia el servidor de desarrollo en segundo plano (`status`, `logs`, `stop`). |
| `npm run build` | Compila la edición estática completa en `./dist/`. |
| `npm run preview` | Sirve localmente la compilación de `./dist/`. |
| `npm test` | Ejecuta las 8 suites de verificación (`node --test tests/release-verification.test.mjs`). |
| `npx playwright test` | Ejecuta la batería de regresión visual e interactiva en Chromium con servidor gestionado. |
| `npm audit --audit-level=high` | Verifica ausencia de vulnerabilidades altas o críticas en dependencias. |
| `git diff --check` | Verifica formato y ausencia de espacios en blanco defectuosos. |

---

## 6. Arquitectura Modular y Motores 3D

La arquitectura separa estrictamente contenido editorial, lógica de dominio, motores de interacción y renderizado:

- **Navegación y Búsqueda (`src/lib/bookManifest.ts`):** Fuente única de verdad para el orden de páginas, estimaciones de lectura y corpus del buscador modal (`Ctrl + K`).
- **Transiciones Espaciales (`src/lib/expandableCardEngine.ts`):** Animaciones FLIP (*First, Last, Invert, Play*), trazos progresivos SVG y tarjetas arrastrables.
- **Modo Presentación (`src/lib/presentationEngine.ts`):** Controlador reutilizable de pantalla completa, avance por pasos, *autoplay* pausable y aislamiento de teclado.
- **Cálculo de Dominio (`src/lib/otifEngine.ts`):** Modelo matemático puro de 200 pedidos semanales desacoplado del DOM.
- **Motores 3D (`src/lib/gears3d/` y `src/lib/system3d/`):** Escenas Three.js + GSAP con puente reactivo hacia las **4 paletas de acento** (`blue`, `orange`, `red`, `green`) y **2 temas** (`dark`, `light`), soporte para `prefers-reduced-motion: reduce`, controles HTML accesibles y liberación explícita de recursos GPU (`dispose`).

---

## 7. Ecosistema de Agentes, Reglas y Skill (`.agents/`)

La orquestación del proyecto está regida por [`AGENTS.md`](AGENTS.md) y estructurada para Google Antigravity bajo el principio de mínimo privilegio:

### Subagentes especializados (`.agents/agents/`)
- **`opex-architect`** ([`.agents/agents/opex-architect.md`](.agents/agents/opex-architect.md)): Revisión de arquitectura, modularidad y límites de dominio *(solo lectura)*.
- **`opex-pedagogy`** ([`.agents/agents/opex-pedagogy.md`](.agents/agents/opex-pedagogy.md)): Validación pedagógica, rigor conceptual y guiones de interacción *(solo lectura)*.
- **`opex-3d-art-director`** ([`.agents/agents/opex-3d-art-director.md`](.agents/agents/opex-3d-art-director.md)): Dirección de arte 3D, storyboard, presupuesto geométrico y licencias *(solo lectura)*.
- **`opex-3d-engineer`** ([`.agents/agents/opex-3d-engineer.md`](.agents/agents/opex-3d-engineer.md)): Implementación autorizada de escenas Three.js, GSAP y GLB (`commandExecutionPolicy: sandbox`).
- **`opex-quality-security`** ([`.agents/agents/opex-quality-security.md`](.agents/agents/opex-quality-security.md)): Auditoría independiente PASS/FAIL de requisitos, lógica, CSP, pruebas y accesibilidad *(solo lectura)*.

### Reglas normativas (`.agents/rules/`)
- **Globales (`trigger: always_on`):**
  - [`opex-engineering-governance.md`](.agents/rules/opex-engineering-governance.md) (Gobierno de ingeniería GOV-01).
  - [`opex-project-identity.md`](.agents/rules/opex-project-identity.md) (Identidad y límites del producto).
- **Contextuales (`trigger: glob`):**
  - [`opex-editorial-typography.md`](.agents/rules/opex-editorial-typography.md) (Activada en archivos `.astro` y `.css`).
  - [`opex-3d-production.md`](.agents/rules/opex-3d-production.md) (Activada en motores, componentes, estilos y assets 3D).

### Skill canónica (`.agents/skills/`)
- **`opex-architecture-review`** ([`.agents/skills/opex-architecture-review/SKILL.md`](.agents/skills/opex-architecture-review/SKILL.md)): Procedimiento estructurado en 7 pasos para evaluar propuestas arquitectónicas bajo demanda.

---

## 8. Flujo Git, Gobernanza y CI/CD

### Control de versiones y ramas
- **Directorio oficial único:** `E:\opexLider` (sin crear worktrees paralelos para desarrollo habitual).
- **Rama de desarrollo activa:** `feature/opex-dev-unified`.
- **Rama de producción estable:** `main` (protegida; prohibido hacer push directo o merge sin autorización explícita del usuario).
- **Protección de páginas congeladas:** Las páginas aprobadas (`00`, `01`) y las escenas 3D no se modifican salvo autorización explícita por página ([`docs/ai/APPROVAL_AND_FREEZE_POLICY.md`](docs/ai/APPROVAL_AND_FREEZE_POLICY.md)).
- **Secuencia obligatoria de entrega:** `Requisitos → Diseño → Implementación → Pruebas → Revisión → Limpieza → Commit → Push` (con aprobación explícita del usuario para commit, push, merge o deploy).

### Integración Continua (`.github/workflows/ci.yml`)
El repositorio cuenta con el workflow **OPEX LÍDER — CI Quality & Security Gate**, que se ejecuta en eventos `push` (`main`, `integration/v1-interactive-book`, `feature/**`) y `pull_request` (`main`, `integration/v1-interactive-book`) sobre `ubuntu-latest` con Node.js `24`:
1. Instalación reproducible (`npm ci`).
2. Auditoría de seguridad bloqueante (`npm audit --audit-level=high`).
3. Compilación estática (`npm run build`).
4. Verificación unitaria, integridad de rutas y hash SHA-256 de CSP (`npm test`).
5. Regresión E2E en navegador Chromium (`npx playwright test`) y captura de artefactos en `test-results/` en caso de fallo.

*(El workflow de GitHub Actions valida calidad y seguridad; no realiza despliegues automáticos a producción).*

---

## 9. Documentación de Referencia

- **Gobierno y Orquestación:** [`AGENTS.md`](AGENTS.md)
- **Estado Oficial del Proyecto:** [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md)
- **Visión del Producto:** [`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md)
- **Arquitectura Técnica:** [`docs/TECH_ARCHITECTURE.md`](docs/TECH_ARCHITECTURE.md)
- **Estándar UX y Presentación:** [`docs/UX_PRESENTATION_STANDARD.md`](docs/UX_PRESENTATION_STANDARD.md)
- **Índice de Contexto AI:** [`docs/ai/README.md`](docs/ai/README.md)
- **Límites Arquitectónicos:** [`docs/ai/ARCHITECTURE_BOUNDARIES.md`](docs/ai/ARCHITECTURE_BOUNDARIES.md)
- **Estado de Páginas `00–19`:** [`docs/ai/PAGE_STATUS_00_19.md`](docs/ai/PAGE_STATUS_00_19.md)
- **Política de Aprobación y Congelación:** [`docs/ai/APPROVAL_AND_FREEZE_POLICY.md`](docs/ai/APPROVAL_AND_FREEZE_POLICY.md)
- **Mapa Operativo de Ramas:** [`docs/ai/GOVERNANCE_BRANCH_MAP.md`](docs/ai/GOVERNANCE_BRANCH_MAP.md)
- **Guía de Interacción Educativa:** [`docs/ai/EDUCATIONAL_INTERACTION_GUIDE.md`](docs/ai/EDUCATIONAL_INTERACTION_GUIDE.md)
- **Estándar de Producción 3D y Assets:** [`docs/ai/3D_PRODUCTION_STANDARD.md`](docs/ai/3D_PRODUCTION_STANDARD.md) · [`docs/ai/3D_ASSETS_POLICY.md`](docs/ai/3D_ASSETS_POLICY.md)
- **Protocolo Cursor ↔ Antigravity:** [`docs/ai/CURSOR_ANTIGRAVITY_HANDOFF.md`](docs/ai/CURSOR_ANTIGRAVITY_HANDOFF.md)
- **Registro de Decisiones (ADR):** [`docs/ai/adr/README.md`](docs/ai/adr/README.md)
