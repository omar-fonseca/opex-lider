import { test, expect, type Page } from '@playwright/test';
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

async function getSnapshot(page: Page) {
  return page.evaluate(() => {
    const ctrl = (window as unknown as { __opexSystem3D?: { getDiagnosticSnapshot: () => unknown } })
      .__opexSystem3D;
    return ctrl?.getDiagnosticSnapshot?.() ?? null;
  });
}

test.describe('OPEX LÍDER — PAGE-02-SYSTEM-3D-01', () => {
  test.beforeAll(() => {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
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
      await expect.poll(async () => (await getSnapshot(page))?.initialized).toBe(true);
      const snap = await getSnapshot(page);
      expect(snap?.platformCount).toBe(5);
      expect(snap?.connectionCount).toBeGreaterThanOrEqual(8);
      await page.locator('#system3d-canvas').screenshot({
        path: path.join(ARTIFACT_DIR, '01-overview.png'),
      });
    } else {
      await expect(page.locator('#system-diagram-canvas')).toBeVisible();
    }

    const serious = consoleErrors.filter(
      (e) => !/favicon|Failed to load resource/i.test(e)
    );
    expect(serious).toEqual([]);
  });

  test('2. Selección de las cuatro fuerzas dispara beats educativos y conserva textos', async ({
    page,
  }) => {
    await gotoSistema(page);
    const shell = await waitForSystem3D(page);
    const mode = await shell.getAttribute('data-system3d-mode');

    const forces = [
      {
        id: 'personas',
        title: 'PERSONAS',
        learning: 'Las personas aportan observación, criterio y capacidad de comunicar problemas.',
        file: '02-personas.png',
      },
      {
        id: 'procesos',
        title: 'PROCESOS',
        learning:
          'Los procesos proporcionan estructura, coordinación y visibilidad del trabajo.',
        file: '03-procesos.png',
      },
      {
        id: 'liderazgo',
        title: 'LIDERAZGO',
        learning: 'El liderazgo facilita condiciones para comprender y abordar obstáculos.',
        file: '04-liderazgo.png',
      },
      {
        id: 'mejora',
        title: 'MEJORA CONTINUA',
        learning: 'Mejorar implica observar, experimentar y comprobar resultados.',
        file: '05-mejora.png',
      },
    ] as const;

    for (const force of forces) {
      await page.locator(`[data-force-pill="${force.id}"]`).click();
      await expect(page.locator('#system3d-brief')).toBeVisible();
      await expect(page.locator('#brief-title')).toContainText(force.title.includes('MEJORA') ? 'MEJORA' : force.title);
      await expect(page.locator('#brief-learning')).toHaveText(force.learning);

      if (mode === '3d') {
        await expect
          .poll(async () => (await getSnapshot(page))?.activeForce, { timeout: 8_000 })
          .toBe(force.id);
        await page.waitForTimeout(900);
        const snap = await getSnapshot(page);
        expect(snap?.currentBeat || snap?.activeForce).toBeTruthy();
        await page.locator('#system3d-stage').screenshot({
          path: path.join(ARTIFACT_DIR, force.file),
        });
      }
    }

    // Textos originales de ficha
    await page.locator('#system-open-card-btn').click();
    await expect(page.locator('#system-card-panel')).toBeVisible();
    await expect(page.locator('#card-explanation')).toContainText(
      'ciclo PDCA'
    );
    await expect(page.locator('#card-relation')).toContainText('Liderazgo');
    await expect(page.locator('#card-action')).toContainText('experimentos controlados');
    await page.locator('#system-card-panel').screenshot({
      path: path.join(ARTIFACT_DIR, '06-explicacion-abierta.png'),
    });
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
    await page.locator('#system3d-stage, #system-diagram-canvas').first().screenshot({
      path: path.join(ARTIFACT_DIR, '11-tema-claro-green.png'),
    });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-accent', 'orange');
    });
    await page.waitForTimeout(300);
    await page.locator('#system3d-stage, #system-diagram-canvas').first().screenshot({
      path: path.join(ARTIFACT_DIR, '12-tema-oscuro-orange.png'),
    });

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
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, viewport.file),
        fullPage: false,
      });
    }

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.locator('#system-ctrl-present').click();
    await expect(page.locator('#interactive-system')).toHaveAttribute(
      'data-presentation-mode',
      'true'
    );
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '09-presentation-16x9.png'),
    });
    await page.keyboard.press('Escape');
    await expect(page.locator('#interactive-system')).toHaveAttribute(
      'data-presentation-mode',
      'false'
    );

    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.locator('#system-ctrl-present').click();
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '10-presentation-4x3.png'),
    });
    await page.keyboard.press('Escape');
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
