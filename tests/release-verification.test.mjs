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
