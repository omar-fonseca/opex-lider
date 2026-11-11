# OPEX LÍDER — Estándar de Experiencia Editorial, Interactividad 3D y Modo Presentación (`UX_PRESENTATION_STANDARD.md`)

**Versión:** 1.1  
**Alcance:** Referencia técnica obligatoria para la evolución de las páginas `02–19` de **OPEX LÍDER**.  
**Origen:** Consolidación de los aprendizajes verificados en `GEAR-3D-01` / `COVER-UX-02` (Página 00) y `PAGE-01-UX-3D-01` / `PAGE-01-UX-3D-02` (Página 01).

> [!IMPORTANT]
> Este documento establece el estándar de ingeniería y experiencia para futuros incrementos. **No autoriza la modificación automática de páginas existentes ni la creación anticipada de las páginas `10–19`** sin instrucción explícita por página.

---

## A. Lectura Normal y Presupuesto Vertical al 100 % de Zoom

1. **Zoom del navegador al 100 % como escenario principal de validación:**
   - Toda página debe diseñarse y verificarse con el navegador al **100 % de zoom** (`devicePixelRatio` nativo, sin escalados artificiales).
   - Queda estrictamente **prohibido** usar `zoom: 0.9`, `transform: scale(0.9)` global, márgenes negativos para ocultar recortes o alturas fijas con `overflow: hidden` que trunquen texto.
2. **Presupuesto vertical del primer pantallazo (*First Fold Budget*):**
   - En resoluciones de escritorio y portátil estándar (`1440×900`, `1366×768`, `1280×800`), la suma de la barra superior (`.reader-topbar`, `70px`), la cabecera editorial (`.editorial-heading`) y el banco interactivo principal (`.expandable-workbench`) junto con sus controles de navegación inferiores debe caber dentro del área visible (`<= 100dvh`) o mantener sus controles inmediatamente accesibles sin obligar a desplazamientos verticales excesivos.
   - Para lograrlo sin reducir la legibilidad:
     - Utilizar cabeceras editoriales equilibradas (por ejemplo, rejilla de 2 columnas en escritorio para `h1` + `.lead`) que ahorren altura vertical innecesaria.
     - Emplear funciones fluidas biaxiales `clamp(min, min(Xvw, Ydvh), max)` en rellenos (`padding`), separaciones (`gap`), alturas de ilustraciones (`max-height`) y títulos.
     - Evitar `min-height` rígidos en escenarios y tarjetas que impidan que el contenedor se adapte a pantallas de `768px` u `800px` de alto.
3. **Soporte de zoom ampliado (`90 %`, `100 %`, `110 %`, `125 %`):**
   - El layout debe responder tanto al viewport efectivo como al zoom real del navegador (`110 %` y `125 %`), permitiendo el flujo vertical natural del documento sin solapamientos, sin texto cortado y con `0px` de desbordamiento horizontal (`scrollWidth <= clientWidth`).
4. **Integridad editorial:**
   - Conservar íntegramente todos los párrafos, títulos, casos prácticos y citas aprobadas. Nunca recortar ni sustituir el contenido pedagógico por resúmenes abreviados.

---

## B. Interactividad Espacial y 3D con Finalidad Educativa

1. **Secuencia pedagógica obligatoria:**
   - **Leer → Visualizar → Interactuar → Comprender → Aplicar.**
2. **Orientación y legibilidad en escenarios 3D / 2.8D:**
   - El elemento o tarjeta protagonista en lectura debe mantenerse **100 % frontal (`rotateY(0deg)`)** para evitar distorsión tipográfica.
   - Los elementos secundarios en profundidad (`stack` o nodos periféricos) deben ser seleccionables mediante clic y teclado (`Tab`, `Enter`, `Espacio`, flechas), manteniendo su plano de intersección activo (`pointer-events: auto` y `z-index` explícito sin quedar detrás del plano `Z = 0` del contenedor).
3. **Transiciones reversibles y controladas por el lector:**
   - Toda animación o recorrido guiado debe iniciarse **en pausa por defecto** (`data-autoplay="false"`).
   - Cualquier interacción manual (clic en pestaña, botón `Anterior`/`Siguiente`, selección de tarjeta o tecla) debe pausar automáticamente el recorrido guiado para respetar el ritmo de lectura o explicación del expositor.
   - Respetar siempre `prefers-reduced-motion: reduce` mediante `prefersReducedMotion()`.
4. **Ilustraciones y explicaciones contextuales:**
   - Las ilustraciones deben ser autoexplicativas, adaptarse a las 4 paletas y 2 temas, y ofrecer un panel contextual accesible por teclado (`aria-expanded`, `aria-controls`, cierre con `Escape`) **sin depender de locución ni audio**.

---

## C. Modo Presentación para Salas y Auditorios (`presentationEngine.ts`)

1. **Reutilización obligatoria del motor oficial:**
   - Utilizar siempre [`createPresentationController`](file:///C:/Users/ASUS/.gemini/antigravity/worktrees/opexLider/cover_gears_3d_01/src/lib/presentationEngine.ts) (`src/lib/presentationEngine.ts`). No crear motores paralelos de pantalla completa.
2. **Encuadre exacto en el contenedor real (`100vw × 100dvh`):**
   - Al activar `data-presentation-mode="true"`, el contenedor ocupa `100vw × 100dvh` (`position: fixed; inset: 0`) organizado mediante **CSS Grid de filas elásticas** (`grid-template-rows: auto auto minmax(0, 1fr) auto`):
     1. Barra superior de presentación (`auto`).
     2. Pestañas o selector de etapas (`auto`).
     3. Escenario principal (`minmax(0, 1fr)` con `height: 100%; overflow: hidden`), con la tarjeta protagonista centrada mediante `margin: auto 0` en su cuerpo interior y desplazamiento interno accesible (`max-height: 100%; overflow-y: auto`) si una explicación desplegable o un zoom ampliado superan la altura disponible.
     4. Barra inferior de controles (`Anterior`, `Recorrido guiado / Play-Pausa`, `Siguiente`, indicadores) (`auto`), **siempre visible dentro del viewport sin recortes**.
   - **Prioridad absoluta al contenido educativo principal:** en Modo Auditorio individual, compactar u ocultar las tarjetas secundarias laterales cuando resten área útil a la tarjeta protagonista, manteniendo intacta la navegación mediante pestañas `01–04`, puntos indicadores, botones `Anterior`/`Siguiente`, teclado y vista comparativa (`Tecla O`).
   - Neutralizar cualquier `transform` o `animation` en ancestros (`.page-stage`) y cualquier animación heredada de opacidad/escala sobre el contenedor activo para evitar transparencias del texto de fondo o multiplicación de escalados en pantalla completa.
3. **Escala tipográfica específica de presentación:**
   - Títulos principales de tarjeta: `clamp(24px, min(2.7vw, 4.2dvh), 46px)` (aproximadamente `32–46 px` en pantallas grandes `16:9` y `4:3`).
   - Texto explicativo principal: `clamp(16px, min(1.62vw, 2.45dvh), 25px)` con alto contraste y nunca reducido por debajo de una lectura cómoda únicamente para forzar el encuadre.
   - Controles e indicadores: altura mínima de `38–44 px` y contraste reforzado.
4. **Compatibilidad de formatos y distancia física:**
   - Validar sistemáticamente en `1920×1080` (`16:9`) y `1440×1080` (`4:3`), tanto en vista de tarjeta protagonista como en vista comparativa general (`Tecla O`).
   - **Nota metodológica obligatoria:** La legibilidad física a distancias de `20–30 metros` depende del tamaño real de la pantalla/proyección y de las condiciones luminosas del auditorio; nunca debe declararse validada únicamente con Playwright y queda sujeta a verificación presencial en sala.

---

## D. Ingeniería, Calidad y No Regresión

1. **Modularidad y aislamiento:**
   - Cada página compleja debe encapsular su diagrama en `src/components/diagrams/` y sus estilos específicos en un archivo dedicado bajo `src/styles/` (ej. `page-01-cards-3d.css`), evitando efectos colaterales sobre `global.css` o páginas previamente cerradas.
2. **Temas, paletas y CSP:**
   - Soportar las **4 paletas de acento** (`blue`, `orange`, `red`, `green`) y los **2 temas** (`dark`, `light`).
   - Preservar la política de seguridad de contenido (`public/_headers`) sin introducir scripts inline no autorizados.
3. **Matriz obligatoria de resoluciones para pruebas E2E (`npx playwright test`):**
   - Móvil: `360×800`, `390×844`
   - Tablet: `768×1024`, `820×1180`
   - Portátil: `1366×768`, `1280×800`
   - Escritorio: `1440×900`
   - Pantalla grande `16:9`: `1920×1080`
   - Presentación `4:3`: `1440×1080`

---

## E. Criterio de Cierre por Página (*Definition of Done*)

Ninguna página de **OPEX LÍDER** podrá declararse terminada hasta cumplir los 8 puntos siguientes:

1. Cumple íntegramente sus requisitos editoriales y conserva los textos aprobados.
2. Sus interacciones 2.8D/3D y explicaciones contextuales funcionan con ratón, teclado y pantalla táctil.
3. Es completamente legible y encuadra sus controles al **100 % de zoom** del navegador (y soporta `90 %`, `110 %` y `125 %` sin pérdida de contenido).
4. Su **Modo Presentación** (`16:9` y `4:3`) encuadra título, ilustración, texto y controles sin recortes y sale limpiamente con `Escape`.
5. Funciona sin desbordamiento horizontal (`0px`) en las 9 resoluciones obligatorias de móvil, tablet, portátil, escritorio y proyector.
6. Supera `npm run build`, `npm test`, `npx playwright test` y `git diff --check` sin regresiones sobre páginas previamente congeladas.
7. Cuenta con evidencia visual comparativa revisada.
8. Recibe aprobación explícita del usuario.
