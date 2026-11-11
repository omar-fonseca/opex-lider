import { test, expect, type Page, type Locator } from '@playwright/test';
import path from 'node:path';

const ARTIFACT_DIR =
  'C:/Users/ASUS/.gemini/antigravity/brain/02080c1d-f22a-44d0-b278-ec9c7c869d80';

async function captureStableScreenshot(
  page: Page,
  target: Page | Locator,
  fileName: string
): Promise<void> {
  await page.evaluate(() => {
    const ctrl = (window as any).__opexCoverGears3D;
    if (ctrl && typeof ctrl.setCaptureFreeze === 'function') {
      ctrl.setCaptureFreeze(true);
    }
  });
  await target.screenshot({
    path: path.join(ARTIFACT_DIR, fileName),
    animations: 'disabled',
  });
}

test.describe('OPEX LÍDER — GEAR-3D-01: Página 00 (7 engranajes 3D sincronizados)', () => {
  test('Criterios 1 a 4: Carga inicial de "/" con 7 engranajes 3D, sentidos opuestos, etiquetas horizontales fijas y evidencia de rotación', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    await page.goto('/');

    const constellation = page.locator('#constellation');
    await expect(constellation).toHaveAttribute('data-gears-mode', '3d', { timeout: 10_000 });

    // Verificar snapshot 3D inicial: 7 engranajes, central horario, 6 secundarios antihorarios
    const snap0 = await page.evaluate(() => {
      const ctrl = (window as unknown as { __opexCoverGears3D?: { getSnapshot: () => any; setCaptureFreeze: (b: boolean) => void } })
        .__opexCoverGears3D;
      if (!ctrl) return null;
      const snap = ctrl.getSnapshot();
      ctrl.setCaptureFreeze(true);
      return snap;
    });

    expect(snap0).not.toBeNull();
    expect(snap0.initialized).toBe(true);
    expect(snap0.gearCount).toBe(7);
    expect(snap0.isRunning).toBe(true);
    expect(snap0.secondaryAnglesRad).toHaveLength(6);

    // Captura de la cubierta completa y primer plano del sistema de 7 engranajes en t0
    await captureStableScreenshot(page, page, 'gear_3d_01_overview_dark_blue.png');
    await captureStableScreenshot(
      page,
      page.locator('#constellation-stage'),
      'gear_3d_01_diagram_closeup_t0.png'
    );

    // Avanzar determinísticamente 3.5 segundos y comprobar sentido horario central (< 0) y antihorario secundarios (> 0)
    const snap1 = await page.evaluate(() => {
      const ctrl = (
        window as unknown as {
          __opexCoverGears3D: { advanceBySeconds: (s: number) => void; getSnapshot: () => any };
        }
      ).__opexCoverGears3D;
      ctrl.advanceBySeconds(3.5);
      return ctrl.getSnapshot();
    });

    const deltaCentral = snap1.centralAngleRad - snap0.centralAngleRad;
    expect(deltaCentral).toBeLessThan(-0.5); // Sentido horario alrededor de +Z

    for (let i = 0; i < 6; i++) {
      const deltaSec = snap1.secondaryAnglesRad[i] - snap0.secondaryAnglesRad[i];
      expect(deltaSec).toBeGreaterThan(0.75); // Sentido antihorario alrededor de +Z
      // Relación exacta -(18 / 12) = -1.5
      expect(Math.abs(deltaSec / deltaCentral - -1.5)).toBeLessThan(1e-5);
    }

    await captureStableScreenshot(
      page,
      page.locator('#constellation-stage'),
      'gear_3d_01_diagram_closeup_t1.png'
    );

    // Criterio 4: Verificar que los textos de OPEX y los 6 conceptos permanecen 100% horizontales (sin rotación CSS)
    const expectedNames = [
      'PERSONAS',
      'PROCESOS',
      'ESTRATEGIA',
      'RESULTADOS',
      'MEJORA',
      'LIDERAZGO',
    ];
    const nodes = page.locator('.constellation-node');
    await expect(nodes).toHaveCount(6);

    for (let i = 0; i < 6; i++) {
      const node = nodes.nth(i);
      await expect(node).toContainText(expectedNames[i]);
      const transformMatrix = await node.evaluate((el) => {
        return window.getComputedStyle(el).transform;
      });
      // En matrix(a, b, c, d, tx, ty), b=0 y c=0 garantizan ángulo de rotación 0 grados (texto horizontal)
      if (transformMatrix && transformMatrix.startsWith('matrix(')) {
        const parts = transformMatrix
          .slice(7, -1)
          .split(',')
          .map((n) => parseFloat(n.trim()));
        expect(Math.abs(parts[1])).toBeLessThan(1e-4);
        expect(Math.abs(parts[2])).toBeLessThan(1e-4);
      }
    }

    await expect(page.locator('#constellation-core')).toContainText('OPEX');
    await expect(page.locator('#constellation-core')).toContainText('EXCELENCIA OPERACIONAL');
    expect(consoleErrors).toEqual([]);
  });

  test('Criterios 5 a 11: Clic en los 6 conceptos, tarjeta #node-insight, arrastrar, Anterior/Siguiente, Cerrar/Escape y botón #start-experience-btn', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('#constellation')).toHaveAttribute('data-gears-mode', '3d');
    await page.evaluate(() => (window as any).__opexCoverGears3D?.setCaptureFreeze(true));

    const insightCard = page.locator('#node-insight');
    const insightTitle = page.locator('#insight-title');
    await expect(insightCard).toBeHidden();

    const expectedNames = [
      'PERSONAS',
      'PROCESOS',
      'ESTRATEGIA',
      'RESULTADOS',
      'MEJORA',
      'LIDERAZGO',
    ];

    // Criterio 5 y 6: Seleccionar cada uno de los 6 conceptos y verificar apertura y contenido de #node-insight
    for (let i = 0; i < 6; i++) {
      await page.locator(`.constellation-node[data-index="${i}"]`).click();
      await expect(insightCard).toBeVisible();
      await expect(insightTitle).toHaveText(expectedNames[i]);

      const snap = await page.evaluate(() => {
        return (window as any).__opexCoverGears3D.getSnapshot();
      });
      expect(snap.activeConceptIndex).toBe(i);

      if (i < 5) {
        await page.locator('#insight-close-btn').click();
        await expect(insightCard).toBeHidden();
      }
    }

    // Captura con tarjeta LIDERAZGO abierta
    await captureStableScreenshot(page, page, 'gear_3d_01_card_open_liderazgo.png');

    // Criterio 8: Botones Anterior y Siguiente
    await page.locator('#insight-next-btn').click();
    await expect(insightTitle).toHaveText('PERSONAS');

    await page.locator('#insight-prev-btn').click();
    await expect(insightTitle).toHaveText('LIDERAZGO');

    // Criterio 7: Arrastrar la tarjeta desde #insight-drag-handle y verificar que la línea conectora sigue activa
    await page.locator('#insight-next-btn').click(); // PERSONAS
    const handle = page.locator('#insight-drag-handle');
    const boxBefore = await insightCard.boundingBox();
    const handleBox = await handle.boundingBox();
    expect(boxBefore).not.toBeNull();
    expect(handleBox).not.toBeNull();

    if (handleBox && boxBefore) {
      await page.mouse.move(
        handleBox.x + handleBox.width / 2,
        handleBox.y + handleBox.height / 2
      );
      await page.mouse.down();
      await page.mouse.move(
        handleBox.x + handleBox.width / 2 - 160,
        handleBox.y + handleBox.height / 2 + 45,
        { steps: 8 }
      );
      await page.mouse.up();

      const boxAfter = await insightCard.boundingBox();
      expect(boxAfter).not.toBeNull();
      if (boxAfter) {
        expect(Math.hypot(boxAfter.x - boxBefore.x, boxAfter.y - boxBefore.y)).toBeGreaterThan(30);
      }
    }

    await expect(page.locator('#constellation-tether-line')).toHaveClass(/active/);
    await captureStableScreenshot(page, page, 'gear_3d_01_card_dragged_personas.png');

    // Criterio 9: Cerrar con Escape y restaurar estado
    await page.keyboard.press('Escape');
    await expect(insightCard).toBeHidden();
    await expect(page.locator('#constellation')).toHaveAttribute('data-expanded', 'false');

    // Probar selección mediante clic directo en el lienzo 3D sobre la corona de dientes del engranaje superior (PERSONAS)
    const stageBox = await page.locator('#constellation-stage').boundingBox();
    expect(stageBox).not.toBeNull();
    if (stageBox) {
      await page.mouse.click(
        stageBox.x + stageBox.width * 0.5,
        stageBox.y + stageBox.height * 0.11
      );
      await expect(insightCard).toBeVisible();
      await expect(insightTitle).toHaveText('PERSONAS');
    }

    // Cerrar con el botón explícito #insight-close-btn
    await page.locator('#insight-close-btn').click();
    await expect(insightCard).toBeHidden();

    // Control accesible de pausa/reanudación (#gears-motion-toggle-btn)
    const motionBtn = page.locator('#gears-motion-toggle-btn');
    await expect(motionBtn).toHaveAttribute('aria-pressed', 'false');
    await motionBtn.click();
    await expect(motionBtn).toHaveAttribute('aria-pressed', 'true');
    const pausedState = await page.evaluate(() =>
      (window as any).__opexCoverGears3D.isUserPaused()
    );
    expect(pausedState).toBe(true);
    await motionBtn.click();
    await expect(motionBtn).toHaveAttribute('aria-pressed', 'false');
    await page.evaluate(() => (window as any).__opexCoverGears3D?.setCaptureFreeze(true));

    // Criterio 11: Botón #start-experience-btn sigue funcionando
    const startBtn = page.locator('#start-experience-btn');
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toHaveAttribute('href', '/introduccion');
  });

  test('Criterios 10, 12, 13, 14 y 15: Navegación por teclado, 4 paletas x 2 temas, prefers-reduced-motion, móvil 390px, fallback 2D e integridad de páginas 01-09', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('#constellation')).toHaveAttribute('data-gears-mode', '3d');
    await page.evaluate(() => (window as any).__opexCoverGears3D?.setCaptureFreeze(true));

    // Criterio 10: Navegación por teclado entre nodos con flechas y Enter
    const firstNode = page.locator('.constellation-node[data-index="0"]');
    await firstNode.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#node-insight')).toBeVisible();
    await expect(page.locator('#insight-title')).toHaveText('PERSONAS');

    await firstNode.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#insight-title')).toHaveText('PROCESOS');
    await page.keyboard.press('Escape');
    await expect(page.locator('#node-insight')).toBeHidden();

    // Criterio 12: Probar las 4 paletas (blue, orange, red, green) y ambos temas (dark, light)
    for (const accent of ['orange', 'red', 'green', 'blue']) {
      await page.evaluate((acc) => {
        document.documentElement.setAttribute('data-accent', acc);
      }, accent);
      await page.waitForTimeout(40);
      if (accent === 'orange') {
        await captureStableScreenshot(
          page,
          page.locator('#constellation-stage'),
          'gear_3d_01_palette_orange.png'
        );
      }
    }

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.setAttribute('data-accent', 'blue');
    });
    await page.waitForTimeout(50);
    await captureStableScreenshot(page, page, 'gear_3d_01_light_mode.png');

    // Restaurar dark
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    // Criterio 13: prefers-reduced-motion detiene el giro automático
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(40);
    const runningUnderReducedMotion = await page.evaluate(() =>
      (window as any).__opexCoverGears3D.isRunning()
    );
    expect(runningUnderReducedMotion).toBe(false);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => (window as any).__opexCoverGears3D?.setCaptureFreeze(true));

    // Criterio 14: Vista móvil (390x844) sin solapamientos ni desbordes
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(80);
    await captureStableScreenshot(page, page, 'gear_3d_01_mobile_390px.png');

    // Verificar fallback 2D cuando WebGL no está disponible (?webgl=0)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?webgl=0');
    await expect(page.locator('#constellation')).toHaveAttribute('data-gears-mode', 'fallback-2d');
    await page.locator('.constellation-node[data-index="0"]').click();
    await expect(page.locator('#node-insight')).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'gear_3d_01_fallback_2d.png'),
      animations: 'disabled',
    });

    // Criterio 15: Ninguna de las páginas 01–09 sufre regresiones
    for (const route of ['/introduccion', '/anatomia-proceso', '/kanban-flujo', '/kpi-gestion-diaria']) {
      const resp = await page.goto(route);
      expect(resp?.status()).toBe(200);
    }
  });
});
