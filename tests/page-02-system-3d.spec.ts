import { test, expect, type Page, type Locator } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = path.resolve('test-results/page-02-system-3d');

async function gotoSistema(page: Page, query = '') {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/sistema${query}`);
}

async function waitForSystem3D(page: Page) {
  const shell = page.locator('#interactive-system');
  await expect(shell).toHaveAttribute('data-system3d-mode', /^(3d|fallback-2d)$/, {
    timeout: 15_000,
  });
  return shell;
}

type SystemSnap = {
  initialized?: boolean;
  isUserPaused?: boolean;
  storyPlaying?: boolean;
  cameraSettled?: boolean;
  renderedFrames?: number;
  activeForce?: string | null;
  relationsMode?: boolean;
  platformCount?: number;
  connectionCount?: number;
  currentBeat?: string | null;
  labelsFramed?: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
  aspect?: number;
  labels?: Array<{ id: string; xPercent: number; yPercent: number }>;
};

async function getSnapshot(page: Page): Promise<SystemSnap | null> {
  return page.evaluate(() => {
    const ctrl = (window as unknown as { __opexSystem3D?: { getDiagnosticSnapshot: () => SystemSnap } })
      .__opexSystem3D;
    return ctrl?.getDiagnosticSnapshot?.() ?? null;
  });
}

async function expectSceneValue(page: Page, key: keyof SystemSnap, expected: string | boolean | null) {
  // Evaluate the same predicate in the browser within 5 s. A late protocol response
  // must not turn an already satisfied scene condition into a client polling failure.
  await page.waitForFunction(({ key, expected }) => {
    const ctrl = (window as unknown as { __opexSystem3D?: { getDiagnosticSnapshot: () => SystemSnap } }).__opexSystem3D;
    const value = ctrl?.getDiagnosticSnapshot()[key];
    return expected === '__truthy__' ? Boolean(value) : value === expected;
  }, { key, expected }, { timeout: 5_000 });
}

async function waitForCamera(page: Page) {
  await expectSceneValue(page, 'cameraSettled', true);
}

async function capture(page: Page, locator: Locator | 'viewport', file: string) {
  // Freeze only while recording evidence, after functional assertions have passed.
  await page.evaluate(() => (window as unknown as { __opexSystem3D?: { setCaptureFreeze: (frozen: boolean) => void } }).__opexSystem3D?.setCaptureFreeze(true));
  try {
    const options = { path: path.join(ARTIFACT_DIR, file), animations: 'disabled' as const };
    if (locator === 'viewport') await page.screenshot(options);
    else await locator.screenshot(options);
  } finally {
    await page.evaluate(() => (window as unknown as { __opexSystem3D?: { setCaptureFreeze: (frozen: boolean) => void } }).__opexSystem3D?.setCaptureFreeze(false));
  }
}

test.describe('OPEX LÍDER — PAGE-02-SYSTEM-3D-01', () => {
  test.beforeAll(() => {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  });

  test.afterEach(async ({ page }) => {
    if (page.isClosed()) return;
    // Release the scene before Chromium tears down the test context.
    await page.evaluate(() => {
      (window as unknown as { __opexSystem3D?: { dispose: () => void } }).__opexSystem3D?.dispose();
    });
  });

  test('1. Escena 3D real con 5 plataformas, conexiones y sin errores de consola', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await gotoSistema(page);
    const shell = await waitForSystem3D(page);
    const mode = await shell.getAttribute('data-system3d-mode');

    if (mode === '3d') {
      await expectSceneValue(page, 'initialized', true);
      const snap = await getSnapshot(page);
      expect(snap?.platformCount).toBe(5);
      expect(snap?.connectionCount).toBeGreaterThanOrEqual(8);
      await waitForCamera(page);
      await capture(page, page.locator('#system3d-canvas'), '01-overview.png');
    } else {
      await expect(page.locator('#system-diagram-canvas')).toBeVisible();
    }

    const serious = consoleErrors.filter(
      (e) => !/favicon|Failed to load resource/i.test(e)
    );
    expect(serious).toEqual([]);
  });

  const forces = [
    { id: 'personas', title: 'PERSONAS', learning: 'Las personas aportan observación, criterio y capacidad de comunicar problemas.', file: '02-personas.png' },
    { id: 'procesos', title: 'PROCESOS', learning: 'Los procesos proporcionan estructura, coordinación y visibilidad del trabajo.', file: '03-procesos.png' },
    { id: 'liderazgo', title: 'LIDERAZGO', learning: 'El liderazgo facilita condiciones para comprender y abordar obstáculos.', file: '04-liderazgo.png' },
    { id: 'mejora', title: 'MEJORA', learning: 'Mejorar implica observar, experimentar y comprobar resultados.', file: '05-mejora.png' },
  ] as const;

  // Independent cases keep scene/interaction assertions inside each test budget.
  for (const force of forces) {
    test(`2. Selección y beat educativo de ${force.id}`, async ({ page }) => {
      await gotoSistema(page);
      const shell = await waitForSystem3D(page);
      await expect(shell).toHaveAttribute('data-system3d-mode', '3d');
      await page.locator(`[data-force-pill="${force.id}"]`).click();
      await expect(page.locator('#system3d-brief')).toBeVisible();
      await expect(page.locator('#brief-title')).toContainText(force.title);
      await expect(page.locator('#brief-learning')).toHaveText(force.learning);
      await expectSceneValue(page, 'activeForce', force.id);
      await expectSceneValue(page, 'currentBeat', '__truthy__');
      await waitForCamera(page);
      await capture(page, page.locator('#system3d-stage'), force.file);
    });
  }

  test('2b. La ficha conserva sus textos y se puede cerrar', async ({ page }) => {
    await gotoSistema(page);
    await waitForSystem3D(page);
    await page.locator('[data-force-pill="mejora"]').click();
    await page.locator('#system-open-card-btn').click();
    await expect(page.locator('#system-card-panel')).toBeVisible();
    await expect(page.locator('#card-explanation')).toContainText('ciclo PDCA');
    await expect(page.locator('#card-relation')).toContainText('Liderazgo');
    await expect(page.locator('#card-action')).toContainText('experimentos controlados');
    await capture(page, page.locator('#system-card-panel'), '06-explicacion-abierta.png');
    await page.locator('#system-close-btn').click();
    await expect(page.locator('#system-card-panel')).toBeHidden();
  });

  test('3. Relaciones, recorrido, pausa, restauración y teclado', async ({ page }) => {
    await gotoSistema(page);
    await waitForSystem3D(page);

    await page.locator('#system-ctrl-relations').click();
    await expect(page.locator('#system-ctrl-relations')).toHaveAttribute('aria-pressed', 'true');

    await page.locator('#system-ctrl-tour').click();
    await expect(page.locator('#system-tour-bar')).toBeVisible();
    await page.locator('#system-tour-next').click();
    await expect(page.locator('#system3d-brief')).toBeVisible();
    await page.locator('#system-tour-next').click();

    await page.locator('#system-ctrl-pause').click();
    await expect(page.locator('#system-ctrl-pause')).toHaveAttribute('aria-pressed', 'true');

    await page.locator('#system-ctrl-restore').click();
    await expect(page.locator('#system-ctrl-relations')).toHaveAttribute('aria-pressed', 'false');
    const snap = await getSnapshot(page);
    if (snap) {
      expect(snap.activeForce).toBeNull();
      expect(snap.relationsMode).toBe(false);
    }

    await page.locator('[data-force-pill="personas"]').click();
    await page.locator('#system-open-card-btn').click();
    await expect(page.locator('#system-card-panel')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#system-card-panel')).toBeHidden();
  });

  test('4. Fallback sin WebGL permanece interactivo', async ({ page }) => {
    await gotoSistema(page, '?webgl=0');
    const shell = await waitForSystem3D(page);
    await expect(shell).toHaveAttribute('data-system3d-mode', 'fallback-2d');
    await expect(page.locator('#system-diagram-canvas')).toBeVisible();
    await page.locator('[data-force-pill="procesos"]').click();
    await expect(page.locator('#system3d-brief')).toBeVisible();
    await expect(page.locator('#brief-title')).toContainText('PROCESOS');
    await page.locator('#system-open-card-btn').click();
    await expect(page.locator('#card-title')).toHaveText('PROCESOS');
  });

  test('5. Temas, paletas, responsive y presentación', async ({ page }) => {
    await gotoSistema(page);
    await waitForSystem3D(page);

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.setAttribute('data-accent', 'green');
    });
    await page.waitForTimeout(300);
    await capture(page, page.locator('#system3d-stage, #system-diagram-canvas').first(), '11-tema-claro-green.png');

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-accent', 'orange');
    });
    await page.waitForTimeout(300);
    await capture(page, page.locator('#system3d-stage, #system-diagram-canvas').first(), '12-tema-oscuro-orange.png');

    for (const viewport of [
      { w: 360, h: 800, file: '07-mobile-360.png' },
      { w: 768, h: 1024, file: '08-tablet-768.png' },
      { w: 1366, h: 768, file: '09-laptop-1366.png' },
    ]) {
      await page.setViewportSize({ width: viewport.w, height: viewport.h });
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      expect(overflow).toBeLessThanOrEqual(1);
      await capture(page, 'viewport', viewport.file);
    }

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.locator('#system-ctrl-present').click();
    await expect(page.locator('#interactive-system')).toHaveAttribute(
      'data-presentation-mode',
      'true'
    );
    await waitForCamera(page);
    const snap16 = await getSnapshot(page);
    if (snap16?.initialized) {
      expect(snap16.labelsFramed).toBe(true);
      expect((snap16.canvasHeight ?? 0) > 400).toBeTruthy();
    }
    await capture(page, 'viewport', '09-presentation-16x9.png');
    await page.keyboard.press('Escape');
    await expect(page.locator('#interactive-system')).toHaveAttribute(
      'data-presentation-mode',
      'false'
    );

    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.locator('#system-ctrl-present').click();
    await waitForCamera(page);
    const snap43 = await getSnapshot(page);
    if (snap43?.initialized) {
      expect(snap43.labelsFramed).toBe(true);
    }
    await capture(page, 'viewport', '10-presentation-4x3.png');
    await page.keyboard.press('Escape');
  });

  test('7. Pausa, cambio de fuerza, reanudación y restauración coherentes', async ({ page }) => {
    await gotoSistema(page);
    await expect(await waitForSystem3D(page)).toHaveAttribute('data-system3d-mode', '3d');
    await page.locator('[data-force-pill="personas"]').click();
    await expectSceneValue(page, 'currentBeat', '__truthy__');
    await page.locator('#system-ctrl-pause').click();
    await expect(page.locator('#system-ctrl-pause')).toHaveAttribute('aria-pressed', 'true');
    await expectSceneValue(page, 'storyPlaying', false);
    await page.locator('[data-force-pill="procesos"]').click();
    await page.waitForFunction(() => {
      const snap = (window as unknown as { __opexSystem3D?: { getDiagnosticSnapshot: () => SystemSnap } }).__opexSystem3D?.getDiagnosticSnapshot();
      return snap?.activeForce === 'procesos' && snap.isUserPaused === true && snap.storyPlaying === false;
    }, undefined, { timeout: 5_000 });
    const paused = await getSnapshot(page);
    expect({ active: paused?.activeForce, paused: paused?.isUserPaused, playing: paused?.storyPlaying })
      .toEqual({ active: 'procesos', paused: true, playing: false });
    await waitForCamera(page);
    await expectSceneValue(page, 'labelsFramed', true);
    await page.locator('#system-ctrl-pause').click();
    await expectSceneValue(page, 'currentBeat', '__truthy__');
    await expect(page.locator('#system-ctrl-pause')).toHaveAttribute('aria-pressed', 'false');
    await page.locator('#system-ctrl-pause').click();
    await page.locator('#system-ctrl-restore').click();
    await page.setViewportSize({ width: 1440, height: 1080 });
    await waitForCamera(page);
    const restored = await getSnapshot(page);
    expect(restored?.activeForce).toBeNull();
    expect(restored?.isUserPaused).toBe(false);
    expect(restored?.relationsMode).toBe(false);
    expect(restored?.labelsFramed).toBe(true);
    await expect(page.locator('#system-ctrl-pause')).toHaveAttribute('aria-pressed', 'false');

  });

  test('7b. Presentación y recorrido conservan el encuadre y el paso al salir', async ({ page }) => {
    await gotoSistema(page);
    await expect(await waitForSystem3D(page)).toHaveAttribute('data-system3d-mode', '3d');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.locator('#system-ctrl-present').click();
    await expect(page.locator('#interactive-system')).toHaveAttribute('data-presentation-mode', 'true');
    await waitForCamera(page);
    await page.locator('#system-pres-next').click();
    await expectSceneValue(page, 'activeForce', 'personas');
    await waitForCamera(page);
    expect((await getSnapshot(page))?.labelsFramed).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#interactive-system')).toHaveAttribute('data-presentation-mode', 'false');
    await waitForCamera(page);
    expect((await getSnapshot(page))?.labelsFramed).toBe(true);
  });

  test('7c. Integración → anterior → salir mantiene sincronizado el recorrido', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoSistema(page);
    await expect(await waitForSystem3D(page)).toHaveAttribute('data-system3d-mode', '3d');
    await page.locator('#system-ctrl-present').click();
    for (let step = 0; step < 5; step += 1) await page.locator('#system-pres-next').click();
    await page.locator('#system-pres-prev').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#brief-title')).toContainText('MEJORA');
    await expect(page.locator('[data-tour-step="4"]')).toHaveClass(/is-active/);
    await expectSceneValue(page, 'activeForce', 'mejora');
    await page.locator('#system-tour-next').click();
    await expect(page.locator('[data-tour-step="5"]')).toHaveClass(/is-active/);
    await expectSceneValue(page, 'activeForce', null);
  });

  for (const force of forces) {
    test(`8. URL ${force.id} se reconcilia después de la importación diferida`, async ({ page }) => {
      // Delay the actual lazy chunk while the URL intent is applied to the controller.
      let release!: () => void;
      const gate = new Promise<void>((resolve) => { release = resolve; });
      await page.route('**/SystemScene3D*.js', async (route) => { await gate; await route.continue(); });
      await page.goto(`/sistema?concept=${force.id}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#brief-title')).toContainText(force.title);
      release();
      await expect(await waitForSystem3D(page)).toHaveAttribute('data-system3d-mode', '3d');
      await expectSceneValue(page, 'activeForce', force.id);
      await waitForCamera(page);
    });
  }

  test('9. Movimiento reducido no realimenta la suscripción de estado', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoSistema(page, '?concept=procesos');
    await expect(await waitForSystem3D(page)).toHaveAttribute('data-system3d-mode', '3d');
    await expectSceneValue(page, 'activeForce', 'procesos');
    await expectSceneValue(page, 'currentBeat', '__truthy__');
    expect(errors).toEqual([]);
    await waitForCamera(page);
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    }));
    const frames = (await getSnapshot(page))?.renderedFrames;
    expect(frames).toBeGreaterThan(0);
    await page.waitForTimeout(200); // A static reduced-motion scene must not redraw continuously.
    expect((await getSnapshot(page))?.renderedFrames).toBe(frames);
    await page.locator('#system-ctrl-relations').click();
    const relations = await getSnapshot(page);
    expect(relations?.relationsMode).toBe(true);
    expect(relations?.renderedFrames).toBeGreaterThan(frames ?? 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('[data-force-pill="personas"]').click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await waitForCamera(page);
    expect((await getSnapshot(page))?.labelsFramed).toBe(true);
  });

  test('10. Fallback comparte pausa y ficha, incluso al reabrir durante el cierre', async ({ page }) => {
    await gotoSistema(page, '?webgl=0&concept=procesos');
    await expect(await waitForSystem3D(page)).toHaveAttribute('data-system3d-mode', 'fallback-2d');
    await expect(page.locator('#brief-title')).toContainText('PROCESOS');
    await page.locator('#system-ctrl-pause').click();
    await expect(page.locator('#system-ctrl-pause')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#system-open-card-btn').click();
    await expect(page.locator('#system-card-panel')).toBeVisible();
    // Synchronous user intents reproduce the old close/reopen timer race.
    await page.evaluate(() => {
      document.getElementById('system-close-btn')?.click();
      document.getElementById('system-open-card-btn')?.click();
    });
    await page.waitForTimeout(500); // Observe beyond the old close timer; not an animation readiness wait.
    await expect(page.locator('#system-card-panel')).toBeVisible();
    await expect(page.locator('#interactive-system')).toHaveAttribute('data-expanded', 'true');
    await page.locator('#system-ctrl-restore').click();
    await expect(page.locator('#system-ctrl-pause')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#system-card-panel')).toBeHidden();
  });

  test('6. No regresión páginas 00 y 01 + puente a 03', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#constellation, .cover-page, h1').first()).toBeVisible();

    await page.goto('/introduccion');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.locator('#intro-cards-workbench, .intro-deck-workbench').first()).toBeVisible();

    await page.goto('/sistema');
    await expect(page.locator('a.primary-action[href="/lider-proceso"]')).toBeVisible();
    await expect(page.locator('.synthesis-col')).toHaveCount(4);
  });
});
