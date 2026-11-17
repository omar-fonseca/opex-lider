import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import {
  TOTAL_WEEKLY_ORDERS,
  TARGET_OTIF_PERCENT,
  INITIAL_COMPLIANT_ORDERS,
  TARGET_COMPLIANT_ORDERS,
  calculateOtif,
  formatDecimalEs,
} from '../src/lib/otifEngine.ts';

import {
  BOOK_PAGES,
  TOTAL_BOOK_PAGES,
  BOOK_SEARCH_ITEMS,
  getPageNavigation,
} from '../src/lib/bookManifest.ts';

import {
  DEFAULT_GEAR_SYSTEM_CONFIG,
  GEAR_CONCEPT_DEFINITIONS,
  GearTransmissionClock,
  buildSevenGearSpecs,
  calculateCenterDistance,
  calculateInitialToothPhase,
  calculatePitchRadius,
  calculateSecondaryAngularVelocity,
  computeGearAnglesAtTime,
  validateGearSystemMechanics,
} from '../src/lib/gears3d/GearTransmission.ts';

import {
  DEFAULT_CAMERA_POSE,
  computeCameraFocusPose,
  computeGearHighlightMap,
  isGenuinePointerClick,
} from '../src/lib/gears3d/GearInteraction.ts';

import { SystemAppStateController } from '../src/lib/system3d/SystemAppState.ts';

import { resolveGearVisualPalette } from '../src/lib/gears3d/GearThemeBridge.ts';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const EXPECTED_ROUTES = [
  '/',
  '/introduccion',
  '/sistema',
  '/lider-proceso',
  '/anatomia-proceso',
  '/gestion-visual',
  '/kanban-concepto',
  '/kanban-flujo',
  '/kpi-concepto',
  '/kpi-gestion-diaria',
];

describe('1. Motor matemático OTIF (src/lib/otifEngine.ts)', () => {
  test('Constantes operacionales base corresponden al modelo de 200 pedidos semanales', () => {
    assert.equal(TOTAL_WEEKLY_ORDERS, 200);
    assert.equal(TARGET_OTIF_PERCENT, 96.0);
    assert.equal(INITIAL_COMPLIANT_ORDERS, 183);
    assert.equal(TARGET_COMPLIANT_ORDERS, 192);
    assert.equal(formatDecimalEs(91.5, 1), '91,5');
  });

  test('Caso base (183 pedidos): 91,5 %, brecha -4,5 pp, faltan 9 pedidos (nivel near)', () => {
    const res = calculateOtif(183);
    assert.equal(res.compliantOrders, 183);
    assert.equal(res.nonCompliantOrders, 17);
    assert.equal(res.otifPercent, 91.5);
    assert.equal(res.additionalOrdersNeeded, 9);
    assert.equal(res.gapPercentagePoints, -4.5);
    assert.equal(res.isTargetMet, false);
    assert.equal(res.statusLevel, 'near');
    assert.equal(res.formattedOtif, '91,5 %');
    assert.equal(res.formattedGap, '−4,5 pp');
  });

  test('Caso meta exacta (192 pedidos): 96,0 %, brecha 0,0 pp, 0 faltantes (nivel met)', () => {
    const res = calculateOtif(192);
    assert.equal(res.compliantOrders, 192);
    assert.equal(res.otifPercent, 96.0);
    assert.equal(res.additionalOrdersNeeded, 0);
    assert.equal(res.gapPercentagePoints, 0);
    assert.equal(res.isTargetMet, true);
    assert.equal(res.statusLevel, 'met');
    assert.equal(res.formattedOtif, '96,0 %');
    assert.equal(res.formattedGap, '0,0 pp');
  });

  test('Caso óptimo (200 pedidos): 100,0 %, brecha +4,0 pp (nivel met)', () => {
    const res = calculateOtif(200);
    assert.equal(res.compliantOrders, 200);
    assert.equal(res.nonCompliantOrders, 0);
    assert.equal(res.otifPercent, 100.0);
    assert.equal(res.gapPercentagePoints, 4.0);
    assert.equal(res.isTargetMet, true);
    assert.equal(res.formattedGap, '+4,0 pp');
  });

  test('Casos límite: desvío crítico (< 90 %) y acotamiento de valores fuera de rango', () => {
    const critical = calculateOtif(170);
    assert.equal(critical.otifPercent, 85.0);
    assert.equal(critical.statusLevel, 'critical');
    assert.equal(critical.isTargetMet, false);

    const negative = calculateOtif(-25);
    assert.equal(negative.compliantOrders, 0);
    assert.equal(negative.otifPercent, 0);

    const overflow = calculateOtif(350);
    assert.equal(overflow.compliantOrders, 200);
    assert.equal(overflow.otifPercent, 100.0);

    const decimal = calculateOtif(183.4);
    assert.equal(decimal.compliantOrders, 183);
  });
});

describe('2. Manifiesto del libro y navegación (src/lib/bookManifest.ts)', () => {
  test('Contiene exactamente las 10 páginas (00 a 09) con rutas únicas y buscador', () => {
    assert.equal(TOTAL_BOOK_PAGES, 10);
    assert.equal(BOOK_PAGES.length, 10);
    assert.deepEqual(
      BOOK_PAGES.map((p) => p.href),
      EXPECTED_ROUTES
    );
    assert.ok(BOOK_SEARCH_ITEMS.length >= 10);
  });

  test('getPageNavigation resuelve correctamente cubierta, página intermedia y cierre', () => {
    const first = getPageNavigation('/');
    assert.equal(first.currentPage, 1);
    assert.equal(first.prevHref, null);
    assert.equal(first.nextHref, '/introduccion');

    const kanban = getPageNavigation('/kanban-flujo/');
    assert.equal(kanban.currentPage, 8);
    assert.equal(kanban.prevHref, '/kanban-concepto');
    assert.equal(kanban.nextHref, '/kpi-concepto');

    const last = getPageNavigation('/kpi-gestion-diaria');
    assert.equal(last.currentPage, 10);
    assert.equal(last.prevHref, '/kpi-concepto');
    assert.equal(last.nextHref, null);
    assert.equal(last.progressPercent, 100);
  });
});

describe('3. Invariantes de componentes interactivos (Kanban 2.8D, KPI y BaseLayout)', () => {
  test('KanbanWipSimulator.astro preserva modelo de 1.000 barras (20 lotes de 50, WIP=2) y 3 colores físicos', () => {
    const kanbanSrc = fs.readFileSync(
      path.join(ROOT_DIR, 'src/components/diagrams/KanbanWipSimulator.astro'),
      'utf8'
    );
    assert.match(kanbanSrc, /const TOTAL_LOTS = 20;/);
    assert.match(kanbanSrc, /const BARS_PER_LOT = 50;/);
    assert.match(kanbanSrc, /const WIP_LIMIT = 2;/);
    assert.match(kanbanSrc, /kb-note-yellow/);
    assert.match(kanbanSrc, /kb-note-pink/);
    assert.match(kanbanSrc, /kb-note-cyan/);
    assert.match(kanbanSrc, /<style is:global>/);
    assert.match(kanbanSrc, /data-kb-initialized/);
  });

  test('KpiAlignmentTree.astro y BaseLayout.astro incluyen guardas de inicialización y protección de flechas', () => {
    const kpiSrc = fs.readFileSync(
      path.join(ROOT_DIR, 'src/components/diagrams/KpiAlignmentTree.astro'),
      'utf8'
    );
    assert.match(kpiSrc, /root\.hasAttribute\('data-initialized'\)/);
    assert.doesNotMatch(kpiSrc, /svgResultKicker/);

    const layoutSrc = fs.readFileSync(
      path.join(ROOT_DIR, 'src/layouts/BaseLayout.astro'),
      'utf8'
    );
    assert.match(layoutSrc, /#kb-note-inspector:not\(\[hidden\]\)/);
    assert.match(layoutSrc, /#kb-tray-drawer:not\(\[hidden\]\)/);
  });
});

describe('4. Integridad del build estático (dist/) y seguridad Cloudflare (_headers / CSP)', () => {
  test('Existen los 10 archivos HTML estáticos generados en dist/ sin enlaces internos rotos', () => {
    assert.ok(fs.existsSync(DIST_DIR), 'El directorio dist/ debe existir (ejecutar npm run build antes)');

    for (const route of EXPECTED_ROUTES) {
      const htmlPath =
        route === '/'
          ? path.join(DIST_DIR, 'index.html')
          : path.join(DIST_DIR, route.slice(1), 'index.html');
      assert.ok(fs.existsSync(htmlPath), `Falta el archivo compilado para la ruta ${route}`);

      const html = fs.readFileSync(htmlPath, 'utf8');
      const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      for (const h of hrefs) {
        if (h.startsWith('http://') || h.startsWith('https://') || h.startsWith('#') || h.startsWith('/_astro/')) {
          continue;
        }
        assert.ok(
          EXPECTED_ROUTES.includes(h) || h === '/favicon.svg' || h === '/favicon.ico',
          `Enlace interno desconocido "${h}" en ${route}`
        );
      }
    }
  });

  test('dist/_headers contiene cabeceras de seguridad y CSP con hash SHA-256 exacto sin unsafe-inline en script-src', () => {
    const headersPath = path.join(DIST_DIR, '_headers');
    assert.ok(fs.existsSync(headersPath), 'Falta dist/_headers');
    const headersContent = fs.readFileSync(headersPath, 'utf8');

    assert.match(headersContent, /X-Content-Type-Options:\s*nosniff/);
    assert.match(headersContent, /X-Frame-Options:\s*DENY/);
    assert.match(headersContent, /Referrer-Policy:\s*strict-origin-when-cross-origin/);

    const cspMatch = headersContent.match(/Content-Security-Policy:\s*([^\r\n]+)/);
    assert.ok(cspMatch, 'Falta cabecera Content-Security-Policy en _headers');
    const csp = cspMatch[1];

    const scriptSrcMatch = csp.match(/script-src\s+([^;]+)/);
    assert.ok(scriptSrcMatch, 'Falta directiva script-src en CSP');
    const scriptSrc = scriptSrcMatch[1];

    assert.doesNotMatch(
      scriptSrc,
      /'unsafe-inline'/,
      'script-src no debe usar unsafe-inline indiscriminadamente'
    );

    // Verificar que cada script inline ejecutable en los 10 HTML coincida con un hash SHA-256 autorizado en script-src
    for (const route of EXPECTED_ROUTES) {
      const htmlPath =
        route === '/'
          ? path.join(DIST_DIR, 'index.html')
          : path.join(DIST_DIR, route.slice(1), 'index.html');
      const html = fs.readFileSync(htmlPath, 'utf8');
      const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
      let m;
      while ((m = scriptRegex.exec(html)) !== null) {
        const attrs = m[1];
        const body = m[2];
        if (/\bsrc=/.test(attrs) || /\btype=["']application\/json["']/i.test(attrs)) {
          continue;
        }
        const hash = 'sha256-' + crypto.createHash('sha256').update(body, 'utf8').digest('base64');
        assert.ok(
          scriptSrc.includes(`'${hash}'`),
          `El script inline en ${route} con hash '${hash}' no está autorizado en script-src (${scriptSrc})`
        );
      }
    }
  });
});

describe('5. Sistema mecánico de 7 engranajes 3D sincronizados en Cubierta (GEAR-3D-01)', () => {
  test('Relación de dientes y sentidos opuestos: central horario (omega < 0) y 6 secundarios antihorarios', () => {
    const specs = buildSevenGearSpecs();
    assert.equal(specs.all.length, 7);
    assert.equal(specs.central.teeth, 18);
    assert.equal(specs.secondaries.length, 6);
    assert.ok(specs.central.angularVelocityRadPerSec < 0, 'El engranaje central debe girar en sentido horario (< 0)');

    const expectedSecondaryOmega = calculateSecondaryAngularVelocity(
      specs.central.teeth,
      specs.secondaries[0].teeth,
      specs.central.angularVelocityRadPerSec
    );
    assert.ok(expectedSecondaryOmega > 0, 'Los 6 engranajes secundarios deben girar en sentido antihorario (> 0)');
    assert.ok(
      Math.abs(expectedSecondaryOmega - -1.5 * specs.central.angularVelocityRadPerSec) < 1e-9,
      'La relación de velocidad debe ser exactamente -(Z_central / Z_secundario) = -1.5'
    );

    for (const sec of specs.secondaries) {
      assert.equal(sec.teeth, 12);
      assert.equal(sec.angularVelocityRadPerSec, expectedSecondaryOmega);
    }
  });

  test('Distancias centro a centro, engrane diente-valle y ausencia de colisión entre secundarios adyacentes', () => {
    const rCentral = calculatePitchRadius(DEFAULT_GEAR_SYSTEM_CONFIG.module, 18);
    const rSec = calculatePitchRadius(DEFAULT_GEAR_SYSTEM_CONFIG.module, 12);
    const dist = calculateCenterDistance(rCentral, rSec, DEFAULT_GEAR_SYSTEM_CONFIG.radialClearance);
    assert.ok(Math.abs(rCentral - 1.44) < 1e-9);
    assert.ok(Math.abs(rSec - 0.96) < 1e-9);
    assert.ok(Math.abs(dist - 2.415) < 1e-9);

    for (const sampleTime of [0, 1.25, 4.8, 19.4]) {
      const check = validateGearSystemMechanics(DEFAULT_GEAR_SYSTEM_CONFIG, sampleTime);
      assert.equal(check.valid, true, `Fallo mecánico en t=${sampleTime}s`);
      assert.ok(check.toothEngagementDepth > 0.2, 'Los dientes central-secundario deben engranar con profundidad real');
      assert.ok(
        check.adjacentSecondaryClearance > 0.2,
        'Los engranajes secundarios adyacentes no deben tocarse ni bloquearse entre sí'
      );
      assert.ok(
        check.maxPhaseAlignmentErrorRad < 1e-9,
        `Desfase diente-valle detectado en t=${sampleTime}s: ${check.maxPhaseAlignmentErrorRad}`
      );
    }
  });

  test('Fases iniciales mecánicas y evolución temporal determinista', () => {
    const t0 = computeGearAnglesAtTime(0);
    const t2 = computeGearAnglesAtTime(2.0);
    const deltaCentral = t2.centralAngleRad - t0.centralAngleRad;
    assert.ok(Math.abs(deltaCentral - DEFAULT_GEAR_SYSTEM_CONFIG.centralAngularVelocity * 2.0) < 1e-9);

    for (let i = 0; i < 6; i++) {
      const deltaSec = t2.secondaryAnglesRad[i] - t0.secondaryAnglesRad[i];
      assert.ok(Math.abs(deltaSec / deltaCentral - -1.5) < 1e-9);
      const expectedPhase0 = calculateInitialToothPhase(
        (GEAR_CONCEPT_DEFINITIONS[i].polarAngleDeg * Math.PI) / 180,
        18,
        12,
        0
      );
      assert.ok(Math.abs(t0.secondaryAnglesRad[i] - expectedPhase0) < 1e-9);
    }
  });

  test('Controlador de pausa y reanudación preserva la fase mecánica exacta sin saltos', () => {
    const clock = new GearTransmissionClock();
    assert.equal(clock.isRunning(), true);

    const step1 = clock.step(0.05);
    assert.ok(Math.abs(step1.elapsedSeconds - 0.05) < 1e-9);

    // Pausar por usuario
    const paused = clock.toggleUserPaused();
    assert.equal(paused, true);
    assert.equal(clock.isRunning(), false);

    const stepWhilePaused = clock.step(0.5);
    assert.ok(Math.abs(stepWhilePaused.elapsedSeconds - 0.05) < 1e-9);
    assert.equal(stepWhilePaused.centralAngleRad, step1.centralAngleRad);

    // Reanudar por usuario
    clock.toggleUserPaused();
    assert.equal(clock.isRunning(), true);
    const stepAfterResume = clock.step(0.05);
    assert.ok(Math.abs(stepAfterResume.elapsedSeconds - 0.1) < 1e-9);

    // Pausa por prefers-reduced-motion
    clock.setReducedMotion(true);
    assert.equal(clock.isRunning(), false);
    clock.setReducedMotion(false);
    assert.equal(clock.isRunning(), true);
  });

  test('Selección de los 6 conceptos, mapa de relaciones, cámara acotada y puente de 4 paletas x 2 temas', () => {
    const expectedLabels = ['PERSONAS', 'PROCESOS', 'ESTRATEGIA', 'RESULTADOS', 'MEJORA', 'LIDERAZGO'];
    assert.deepEqual(
      GEAR_CONCEPT_DEFINITIONS.map((d) => d.label),
      expectedLabels
    );

    for (let idx = 0; idx < 6; idx++) {
      const map = computeGearHighlightMap(idx);
      assert.equal(map.activeIndex, idx);
      assert.equal(map.secondaryStates[idx], 'active');
      assert.equal(map.connectedIndices.length, 3);
      for (const connIdx of map.connectedIndices) {
        assert.equal(map.secondaryStates[connIdx], 'connected');
      }
      const dimmedCount = map.secondaryStates.filter((s) => s === 'dimmed').length;
      assert.equal(dimmedCount, 2);

      const camPose = computeCameraFocusPose(idx);
      assert.ok(Math.abs(camPose.positionX - DEFAULT_CAMERA_POSE.positionX) < 0.5);
      assert.ok(Math.abs(camPose.positionY - DEFAULT_CAMERA_POSE.positionY) < 0.5);
    }

    assert.equal(isGenuinePointerClick(100, 100, 103, 104), true);
    assert.equal(isGenuinePointerClick(100, 100, 130, 140), false);

    for (const theme of ['dark', 'light']) {
      for (const accent of ['blue', 'orange', 'red', 'green']) {
        const pal = resolveGearVisualPalette(theme, accent);
        assert.equal(pal.theme, theme);
        assert.equal(pal.accent, accent);
        assert.ok(pal.accentHex > 0);
      }
    }
  });
});


describe('6. Refinamiento editorial y responsive de Cubierta (COVER-UX-02)', () => {
  test('index.astro ubica Omar Yesid Fonseca debajo del subtítulo sin duplicados y preserva textos originales', () => {
    const indexSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/pages/index.astro'), 'utf8');

    // Exactamente una firma visible en el cuerpo de la cubierta
    const authorMatches = [...indexSrc.matchAll(/<em class="credit-author">Omar Yesid Fonseca<\/em>/g)];
    assert.equal(authorMatches.length, 1, 'No debe duplicarse la firma en el pie de página');

    // Ubicada después del subtítulo dentro de .cover-header-block
    const headerBlockMatch = indexSrc.match(/<div class="cover-header-block">([\s\S]*?)<\/div>\s*<\/div>/);
    assert.ok(headerBlockMatch, 'El bloque .cover-header-block debe contener el crédito de autoría');
    assert.match(headerBlockMatch[0], /Libro interactivo de liderazgo y excelencia operacional\./);
    assert.match(headerBlockMatch[0], /Omar Yesid Fonseca/);

    // Guía de lectura con texto intacto
    assert.match(indexSrc, /<span>CÓMO LEER ESTE LIBRO<\/span>/);
    assert.match(
      indexSrc,
      /Avanza en orden o utiliza el índice para volver a una pregunta concreta\. Toca los conceptos, observa qué conexiones aparecen y contrasta cada modelo con tu propio contexto operacional\. No busques recetas: busca relaciones causales y comportamientos sostenibles\./
    );
  });
});

describe('7. Evolución editorial 3D de las cuatro tarjetas de Página 01 (PAGE-01-UX-3D-01)', () => {
  test('Preserva íntegramente los 4 conceptos y párrafos originales, ilustraciones contextuales sin audio y modo auditorio reutilizando presentationEngine.ts', () => {
    const introPageSrc = fs.readFileSync(
      path.join(ROOT_DIR, 'src/pages/introduccion.astro'),
      'utf8'
    );
    const cardsCompSrc = fs.readFileSync(
      path.join(ROOT_DIR, 'src/components/diagrams/IntroOperationalCards3D.astro'),
      'utf8'
    );

    // 1. Conservación exacta de los 4 títulos y párrafos originales
    assert.match(cardsCompSrc, /El espejismo de las herramientas/);
    assert.match(
      cardsCompSrc,
      /Implementar 5S, tableros Kanban o rutinas de supervisión sin clarificar su propósito genera fatiga y burocracia\. Las herramientas solo cobran sentido cuando responden a un problema real de la operación y cuando el equipo entiende qué brecha busca cerrar\./
    );

    assert.match(cardsCompSrc, /El sistema como totalidad viva/);
    assert.match(
      cardsCompSrc,
      /Una desviación en calidad o un retraso en entrega rara vez es un fallo individual\. Con frecuencia involucra el diseño del flujo, la claridad del estándar, el ritmo de los insumos y la forma en que el líder reacciona frente al error\. Quien solo mira la pieza pierde de vista el engranaje\./
    );

    assert.match(cardsCompSrc, /Seguridad para cuestionar/);
    assert.match(
      cardsCompSrc,
      /Ningún estándar se mantiene vivo sin personas dispuestas a levantar la mano ante una anomalía\. Cuando un entorno castiga el error, los problemas no desaparecen: se ocultan hasta convertirse en crisis\. La excelencia exige confianza técnica y psicológica en la línea de trabajo\./
    );

    assert.match(cardsCompSrc, /De la intuición a la evidencia/);
    assert.match(
      cardsCompSrc,
      /Aprender en las operaciones significa sustituir las opiniones jerárquicas por datos contrastados en el Gemba \(el lugar real\)\. Cada desviación deja de ser una molestia y pasa a ser información privilegiada para ajustar el proceso con rigor y disciplina\./
    );

    // 2. Reutilización de createPresentationController y ausencia de elementos de audio/voz
    assert.match(cardsCompSrc, /createPresentationController/);
    assert.doesNotMatch(cardsCompSrc, /<audio|speechSynthesis|AudioContext/i);

    // 3. Conservación del encabezado, caso breve, principio clave y CTA en introduccion.astro
    assert.match(introPageSrc, /Antes de hablar de herramientas/);
    assert.match(introPageSrc, /CASO BREVE · DESVIACIÓN EN ENTREGA/);
    assert.match(introPageSrc, /Dos respuestas frente al mismo incidente/);
    assert.match(introPageSrc, /PRINCIPIO CLAVE/);
    assert.match(introPageSrc, /Explora la anatomía del sistema/);
  });

  test('Cumple el estándar PAGE-01-UX-3D-02: presupuesto vertical sin zoom artificial y docs/UX_PRESENTATION_STANDARD.md', () => {
    const cssSrc = fs.readFileSync(
      path.join(ROOT_DIR, 'src/styles/page-01-cards-3d.css'),
      'utf8'
    );
    const stdDocPath = path.join(ROOT_DIR, 'docs/UX_PRESENTATION_STANDARD.md');
    assert.ok(fs.existsSync(stdDocPath), 'Falta el documento estándar docs/UX_PRESENTATION_STANDARD.md');

    const stdDoc = fs.readFileSync(stdDocPath, 'utf8');
    assert.match(stdDoc, /100 % de zoom/);
    assert.match(stdDoc, /presentationEngine\.ts/);
    assert.match(stdDoc, /16:9/);
    assert.match(stdDoc, /4:3/);

    // Prohibido usar zoom: 0.9 o transform: scale(0.9) global para enmascarar problemas de proporción
    assert.doesNotMatch(cssSrc, /\bzoom\s*:\s*0\.\d+/i);
    assert.match(cssSrc, /100dvh/);
    assert.match(cssSrc, /grid-template-rows:\s*auto\s+auto\s+minmax\(0,\s*1fr\)\s+auto/);
  });
});

describe('8. Estado funcional único de la página 02', () => {
  test('La pausa persiste al cambiar de fuerza; restaurar reanuda y borra selección/ficha/relaciones', () => {
    const state = new SystemAppStateController();
    state.selectForce('personas');
    state.setPaused(true);
    state.setRelationsVisible(true);
    state.openCard();
    state.selectForce('procesos');
    assert.equal(state.getSnapshot().isPaused, true);
    assert.equal(state.getSnapshot().activeForce, 'procesos');
    assert.equal(state.getSnapshot().cardOpen, false);
    state.restore();
    const restored = state.getSnapshot();
    assert.equal(restored.activeForce, null);
    assert.equal(restored.isPaused, false);
    assert.equal(restored.cardOpen, false);
    assert.equal(restored.relationsVisible, false);
    assert.equal(restored.briefOpen, false);
    assert.equal(restored.currentBeatLabel, null);
  });

  test('Beats y ficha no reproducen una selección; la misma fuerza puede volver a seleccionarse', () => {
    const state = new SystemAppStateController();
    state.selectForce('personas');
    const revision = state.getSnapshot().selectionRevision;
    state.setBeatLabel('Observa la solicitud');
    state.openCard();
    state.setPaused(true);
    assert.equal(state.getSnapshot().selectionRevision, revision);
    state.selectForce('personas', { keepCard: true });
    assert.equal(state.getSnapshot().selectionRevision, revision + 1);
    assert.equal(state.getSnapshot().cardOpen, true);
    assert.equal(state.getSnapshot().currentBeatLabel, null);
  });

  test('El recorrido reanuda, normaliza índices inválidos y mantiene la selección educativa', () => {
    const state = new SystemAppStateController();
    for (const index of [NaN, Infinity, -Infinity, -1, 0.8]) {
      state.setPaused(true);
      state.startTour(index);
      assert.equal(state.getSnapshot().tourStepIndex, 0);
      assert.equal(state.getSnapshot().isPaused, false);
    }
    state.nextTourStep();
    assert.equal(state.getSnapshot().activeForce, 'personas');
    state.startTour(999);
    assert.equal(state.getSnapshot().tourStep.id, 'integration');
    assert.equal(state.getSnapshot().activeForce, null);
    assert.equal(state.getSnapshot().relationsVisible, true);
    state.selectForce('mejora', { keepTour: true });
    assert.equal(state.getSnapshot().tourStepIndex, 4);
    assert.equal(state.getSnapshot().tourStep.forceId, 'mejora');
    assert.equal(state.getSnapshot().viewMode, 'tour');
    state.nextTourStep();
    assert.equal(state.getSnapshot().tourStep.id, 'integration');
  });

  test('Cerrar la explicación breve no cambia selección; unsubscribe deja de recibir cambios', () => {
    const state = new SystemAppStateController();
    const seen = [];
    const unsubscribe = state.subscribe((snapshot) => seen.push(snapshot));
    state.selectForce('mejora');
    state.closeBrief();
    assert.equal(state.getSnapshot().activeForce, 'mejora');
    assert.equal(state.getSnapshot().briefOpen, false);
    const before = seen.length;
    unsubscribe();
    state.restore();
    assert.equal(seen.length, before);
  });
});
