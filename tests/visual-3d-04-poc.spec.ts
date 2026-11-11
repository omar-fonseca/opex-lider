import { test, expect } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.join(process.cwd(), 'dist');
const ARTIFACT_DIR =
  'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\02080c1d-f22a-44d0-b278-ec9c7c869d80';

function parseGlobalHeaders(): Record<string, string> {
  const headersFile = path.join(DIST_DIR, '_headers');
  const content = fs.readFileSync(headersFile, 'utf8');
  const headers: Record<string, string> = {};
  const lines = content.split(/\r?\n/);
  let inGlobal = false;
  for (const line of lines) {
    if (line.trim() === '/*') {
      inGlobal = true;
      continue;
    }
    if (line.startsWith('/')) {
      inGlobal = false;
      continue;
    }
    if (inGlobal && line.includes(':')) {
      const idx = line.indexOf(':');
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      headers[key] = val;
    }
  }
  return headers;
}

const MIME_MAP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
};

let server: http.Server;
let baseUrl = '';

test.beforeAll(async () => {
  const securityHeaders = parseGlobalHeaders();
  server = http.createServer((req, res) => {
    const reqUrl = (req.url || '/').split('?')[0];
    let filePath = path.join(DIST_DIR, reqUrl);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!path.extname(filePath)) {
      filePath = path.join(filePath, 'index.html');
    }

    for (const [k, v] of Object.entries(securityHeaders)) {
      res.setHeader(k, v);
    }

    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    res.setHeader('Content-Type', MIME_MAP[ext] || 'application/octet-stream');
    res.end(fs.readFileSync(filePath));
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      resolve();
    });
  });
});

test.afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('1. Regresión de páginas 00-09: no descargan el chunk 3D y mantienen 0 violaciones CSP', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const cspViolations: string[] = [];
  const loadedScripts: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('request', (req) => {
    if (req.url().endsWith('.js')) loadedScripts.push(req.url());
  });

  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      (window as unknown as { __cspErrs: string[] }).__cspErrs =
        (window as unknown as { __cspErrs: string[] }).__cspErrs || [];
      (window as unknown as { __cspErrs: string[] }).__cspErrs.push(
        e.violatedDirective
      );
    });
  });

  // Visitar página 04 publicada (/anatomia-proceso) y página 07 (/kanban-flujo)
  for (const route of ['/', '/anatomia-proceso', '/kanban-flujo', '/kpi-concepto']) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    const violations = await page.evaluate(
      () => (window as unknown as { __cspErrs?: string[] }).__cspErrs || []
    );
    cspViolations.push(...violations);
  }

  expect(consoleErrors).toEqual([]);
  expect(cspViolations).toEqual([]);
  const has3DChunk = loadedScripts.some((u) =>
    /processThreeScene/i.test(u)
  );
  expect(has3DChunk).toBe(false);
});

test('2. Prototipo 3D aislado (/lab/anatomia-proceso-3d): carga diferida, selección, enfoque GSAP, despiece, paletas y limpieza', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto(`${baseUrl}/lab/anatomia-proceso-3d`, {
    waitUntil: 'networkidle',
  });

  const workbench = page.locator('#poc3d-workbench');
  await workbench.scrollIntoViewIfNeeded();
  await expect(workbench).toHaveAttribute('data-webgl-ready', 'true', {
    timeout: 10000,
  });
  await page.waitForTimeout(200);

  // Captura 1: Vista general del sistema 3D en modo oscuro
  await workbench.screenshot({
    path: path.join(ARTIFACT_DIR, 'visual_3d_04_overview_dark.png'),
  });

  // Verificar que en reposo el bucle requestAnimationFrame se detiene
  await page.waitForTimeout(250);
  const idleDiag = await page.evaluate(() => {
    const api = (window as unknown as { __opexPoc3D: { getDiagnostics: () => { isRenderingLoopActive: boolean; renderedFrameCount: number } } }).__opexPoc3D;
    return api.getDiagnostics();
  });
  expect(idleDiag.renderedFrameCount).toBeGreaterThanOrEqual(1);
  expect(idleDiag.isRenderingLoopActive).toBe(false);

  // Seleccionar Actividades de Transformación y activar Despiece espacial
  await page.click('[data-poc-select="transformacion"]');
  await expect(workbench).toHaveAttribute('data-selected-element', 'transformacion');
  await expect(page.locator('#poc3d-insp-title')).toContainText(
    'Actividades de transformación'
  );

  await page.click('#poc3d-explode-btn');
  await expect(workbench).toHaveAttribute('data-exploded', 'true');

  // Esperar a que termine la transición GSAP (~650ms)
  await page.waitForTimeout(800);

  // Verificar etiquetas HTML de sub-piezas visibles en despiece
  await expect(page.locator('[data-subpart-tag="tr-core"]')).toBeVisible();

  // Captura 2: Enfoque GSAP + Despiece espacial activo en Transformación
  await workbench.screenshot({
    path: path.join(ARTIFACT_DIR, 'visual_3d_04_exploded_transformacion.png'),
  });

  // Seleccionar el mecanismo conectado de Control y retroalimentación + probar tema claro y paleta verde
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-accent', 'green');
  });
  await page.click('[data-poc-select="control"]');
  await expect(workbench).toHaveAttribute('data-selected-element', 'control');
  await expect(page.locator('#poc3d-insp-title')).toContainText(
    'Control y retroalimentación'
  );
  await page.waitForTimeout(800);

  // Captura 3: Mecanismo conectado de Control y retroalimentación en tema claro + paleta verde
  await workbench.screenshot({
    path: path.join(ARTIFACT_DIR, 'visual_3d_04_control_bridge_light.png'),
  });

  // Probar navegación por teclado (tecla '1' -> Entrada, tecla 'R' -> Restaurar)
  await page.keyboard.press('1');
  await expect(workbench).toHaveAttribute('data-selected-element', 'entrada');
  await page.keyboard.press('r');
  await expect(workbench).toHaveAttribute('data-selected-element', 'none');
  await expect(workbench).toHaveAttribute('data-exploded', 'false');

  // Probar alternativa legible sin WebGL
  await page.click('#poc3d-mode-toggle-btn');
  await expect(workbench).toHaveAttribute('data-view-mode', '2d-fallback');
  await expect(page.locator('#poc3d-fallback-view')).toBeVisible();

  // Captura 4: Alternativa accesible sin WebGL
  await workbench.screenshot({
    path: path.join(ARTIFACT_DIR, 'visual_3d_04_fallback_2d.png'),
  });

  // Volver a 3D y probar vista móvil 390x844
  await page.locator('#poc3d-mode-toggle-btn').click();
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('data-accent', 'orange');
    window.scrollTo(0, 320);
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);

  // Captura 5: Vista móvil 390px con paleta naranja
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'visual_3d_04_mobile_390px.png'),
    fullPage: false,
  });

  // Verificar limpieza determinista de recursos WebGL (dispose)
  const disposedDiag = await page.evaluate(() => {
    const api = (window as unknown as { __opexPoc3D: { dispose: () => { isDisposed: boolean; disposedGeometries: number; disposedMaterials: number } } }).__opexPoc3D;
    return api.dispose();
  });
  expect(disposedDiag.isDisposed).toBe(true);
  expect(disposedDiag.disposedGeometries).toBeGreaterThan(0);
  expect(disposedDiag.disposedMaterials).toBeGreaterThan(0);
  expect(consoleErrors).toEqual([]);
});

test('3. Soporte de movimiento reducido (prefers-reduced-motion: reduce)', async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();

  await page.goto(`${baseUrl}/lab/anatomia-proceso-3d`, {
    waitUntil: 'networkidle',
  });
  const workbench = page.locator('#poc3d-workbench');
  await expect(workbench).toHaveAttribute('data-webgl-ready', 'true');

  await page.click('[data-poc-select="salida"]');
  await page.click('#poc3d-explode-btn');

  // Con movimiento reducido la transición es instantánea y el bucle no queda activo
  const diag = await page.evaluate(() => {
    const api = (window as unknown as { __opexPoc3D: { getDiagnostics: () => { isRenderingLoopActive: boolean } } }).__opexPoc3D;
    return api.getDiagnostics();
  });
  expect(diag.isRenderingLoopActive).toBe(false);
  await context.close();
});
