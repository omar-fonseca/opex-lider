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

test.describe('OPEX LÍDER — GEAR-3D-01 + COVER-UX-02: Cubierta 3D y refinamiento editorial/responsive', () => {
  test('1. Autoría reubicada, espacios verticales corregidos, guía horizontal de ancho completo y 7 engranajes 3D sincronizados', async ({
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

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const constellation = page.locator('#constellation');
    await expect(constellation).toHaveAttribute('data-gears-mode', '3d', { timeout: 10_000 });

    // Validación COVER-UX-02 (1 y 2): Autoría debajo del subtítulo y sin duplicados en el pie
    const authorCredits = page.locator('.credit-author');
    await expect(authorCredits).toHaveCount(1);
    await expect(authorCredits).toHaveText('Omar Yesid Fonseca');
    await expect(page.locator('.cover-bottom-bar .credit-block')).toHaveCount(0);
    await expect(page.locator('.cover-header-block .cover-author-credit')).toBeVisible();

    // Validación COVER-UX-02 (3): Jerarquía vertical compacta sin huecos artificiales
    const titleBox = await page.locator('#cover-title').boundingBox();
    const subtitleBox = await page.locator('.cover-subtitle').boundingBox();
    const creditBox = await page.locator('.cover-author-credit').boundingBox();
    const cueBox = await page.locator('#cover-card-block').boundingBox();
    const purposeBox = await page.locator('.cover-purpose-block').boundingBox();

    expect(titleBox).not.toBeNull();
    expect(subtitleBox).not.toBeNull();
    expect(creditBox).not.toBeNull();
    expect(cueBox).not.toBeNull();
    expect(purposeBox).not.toBeNull();

    if (titleBox && subtitleBox && creditBox && cueBox && purposeBox) {
      expect(subtitleBox.y).toBeGreaterThan(titleBox.y);
      expect(creditBox.y).toBeGreaterThan(subtitleBox.y);
      expect(cueBox.y).toBeGreaterThan(creditBox.y);
      // Espacio vertical entre el bloque de autoría y SISTEMA SINCRONIZADO debe ser compacto (< 36px)
      const gapCreditToCue = cueBox.y - (creditBox.y + creditBox.height);
      expect(gapCreditToCue).toBeLessThan(36);
      expect(gapCreditToCue).toBeGreaterThanOrEqual(4);

      // Espacio entre SISTEMA SINCRONIZADO y PROPÓSITO DE ESTA EDICIÓN debe ser compacto (< 36px)
      const gapCueToPurpose = purposeBox.y - (cueBox.y + cueBox.height);
      expect(gapCueToPurpose).toBeLessThan(36);
    }

    // Validación COVER-UX-02 (4 y 5): "CÓMO LEER ESTE LIBRO" de ancho completo con encabezado encima del texto
    const coverPageBox = await page.locator('.cover-page').boundingBox();
    const bottomBarBox = await page.locator('.cover-bottom-bar').boundingBox();
    const guideTitleBox = await page.locator('.cover-reading-guide span').boundingBox();
    const guideTextBox = await page.locator('.cover-reading-guide p').boundingBox();

    expect(coverPageBox).not.toBeNull();
    expect(bottomBarBox).not.toBeNull();
    expect(guideTitleBox).not.toBeNull();
    expect(guideTextBox).not.toBeNull();

    if (coverPageBox && bottomBarBox && guideTitleBox && guideTextBox) {
      // Ancho completo útil dentro del contenedor .cover-page
      expect(bottomBarBox.width).toBeGreaterThan(coverPageBox.width * 0.84);
      // Título encima del párrafo explicativo
      expect(guideTitleBox.y + guideTitleBox.height).toBeLessThanOrEqual(guideTextBox.y + 2);
      // Alineación horizontal coincidente
      expect(Math.abs(guideTitleBox.x - guideTextBox.x)).toBeLessThan(8);
    }

    // Verificar snapshot 3D inicial: 7 engranajes, central horario, 6 secundarios antihorarios
    const snap0 = await page.evaluate(() => {
      const ctrl = (window as any).__opexCoverGears3D;
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

    await captureStableScreenshot(page, page, 'cover_ux_02_desktop_1440px.png');
    await captureStableScreenshot(
      page,
      page.locator('#constellation-stage'),
      'gear_3d_01_diagram_closeup_t0.png'
    );

    // Avanzar determinísticamente 3.5 segundos y comprobar transmisión mecánica
    const snap1 = await page.evaluate(() => {
      const ctrl = (window as any).__opexCoverGears3D;
      ctrl.advanceBySeconds(3.5);
      return ctrl.getSnapshot();
    });

    const deltaCentral = snap1.centralAngleRad - snap0.centralAngleRad;
    expect(deltaCentral).toBeLessThan(-0.5);

    for (let i = 0; i < 6; i++) {
      const deltaSec = snap1.secondaryAnglesRad[i] - snap0.secondaryAnglesRad[i];
      expect(deltaSec).toBeGreaterThan(0.75);
      expect(Math.abs(deltaSec / deltaCentral - -1.5)).toBeLessThan(1e-5);
    }

    await captureStableScreenshot(
      page,
      page.locator('#constellation-stage'),
      'gear_3d_01_diagram_closeup_t1.png'
    );

    // Verificar que las 6 etiquetas permanecen horizontales
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
      await expect(nodes.nth(i)).toContainText(expectedNames[i]);
    }

    expect(consoleErrors).toEqual([]);
  });

  test('2. Interacción completa: apertura de las 6 tarjetas FLIP, arrastre, navegación, pausa, 4 paletas y 2 temas', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
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

    for (let i = 0; i < 6; i++) {
      await page.locator(`.constellation-node[data-index="${i}"]`).click();
      await expect(insightCard).toBeVisible();
      await expect(insightTitle).toHaveText(expectedNames[i]);

      if (i < 5) {
        await page.locator('#insight-close-btn').click();
        await expect(insightCard).toBeHidden();
      }
    }

    await captureStableScreenshot(page, page, 'cover_ux_02_card_open_liderazgo.png');

    // Anterior / Siguiente
    await page.locator('#insight-next-btn').click();
    await expect(insightTitle).toHaveText('PERSONAS');
    await page.locator('#insight-prev-btn').click();
    await expect(insightTitle).toHaveText('LIDERAZGO');

    // Arrastrar tarjeta desde la etiqueta de agarre (.card-drag-grip-label) y comprobar línea conectora
    await page.locator('#insight-next-btn').click(); // PERSONAS
    const handle = page.locator('#insight-drag-handle .card-drag-grip-label');
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
    await page.keyboard.press('Escape');
    await expect(insightCard).toBeHidden();

    // Control de pausa/reanudación (#gears-motion-toggle-btn)
    const motionBtn = page.locator('#gears-motion-toggle-btn');
    await expect(motionBtn).toHaveAttribute('aria-pressed', 'false');
    await motionBtn.click();
    await expect(motionBtn).toHaveAttribute('aria-pressed', 'true');
    await motionBtn.click();
    await expect(motionBtn).toHaveAttribute('aria-pressed', 'false');
    await page.evaluate(() => (window as any).__opexCoverGears3D?.setCaptureFreeze(true));

    // Probar las 4 paletas (blue, orange, red, green) y ambos temas (dark, light)
    for (const accent of ['green', 'orange', 'red', 'blue']) {
      await page.evaluate((acc) => {
        document.documentElement.setAttribute('data-accent', acc);
      }, accent);
      await page.waitForTimeout(30);
      if (accent === 'green') {
        await captureStableScreenshot(page, page, 'cover_ux_02_palette_green.png');
      }
    }

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.setAttribute('data-accent', 'blue');
    });
    await page.waitForTimeout(40);
    await captureStableScreenshot(page, page, 'cover_ux_02_light_mode.png');

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    // prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const runningReduced = await page.evaluate(() =>
      (window as any).__opexCoverGears3D.isRunning()
    );
    expect(runningReduced).toBe(false);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  test('3. Validación responsive sin overflow horizontal en los 8 anchos obligatorios (360, 390, 768, 820, 1024, 1280, 1440, 1920 + 4:3) e integridad 01-09', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('#constellation')).toHaveAttribute('data-gears-mode', '3d');
    await page.evaluate(() => (window as any).__opexCoverGears3D?.setCaptureFreeze(true));

    const viewports = [
      { width: 360, height: 800, label: 'mobile_360px', screenshot: true },
      { width: 390, height: 844, label: 'mobile_390px', screenshot: true },
      { width: 768, height: 1024, label: 'tablet_768px', screenshot: true },
      { width: 820, height: 1180, label: 'tablet_820px', screenshot: false },
      { width: 1024, height: 768, label: 'laptop_1024px', screenshot: true },
      { width: 1280, height: 800, label: 'laptop_1280px', screenshot: false },
      { width: 1440, height: 1080, label: 'presentation_4_3_1440x1080', screenshot: false },
      { width: 1920, height: 1080, label: 'presentation_16_9_1920px', screenshot: true },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(80);

      // Comprobar ausencia total de overflow horizontal
      const overflowCheck = await page.evaluate(() => {
        const doc = document.documentElement;
        const cw = doc.clientWidth;
        const culprits: string[] = [];
        document.querySelectorAll('*').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.right > cw + 1 || el.scrollWidth > cw + 1) {
            const cls = (el as HTMLElement).className
              ? `.${String((el as HTMLElement).className).trim().split(/\s+/).join('.')}`
              : '';
            culprits.push(
              `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls}[right=${Math.round(r.right)},sw=${el.scrollWidth},w=${Math.round(r.width)}]`
            );
          }
        });
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: cw,
          culprits: culprits.slice(0, 12),
        };
      });
      expect(
        overflowCheck.scrollWidth,
        `Overflow horizontal detectado en ${vp.label} (${vp.width}x${vp.height}): scrollWidth=${overflowCheck.scrollWidth} > clientWidth=${overflowCheck.clientWidth} | culprits=${overflowCheck.culprits.join(', ')}`
      ).toBeLessThanOrEqual(overflowCheck.clientWidth + 1);

      // En móvil (<= 720px), verificar orden natural de lectura: Autoría antes de la escena 3D y Guía al final
      if (vp.width <= 720) {
        const creditBox = await page.locator('.cover-author-credit').boundingBox();
        const gearsBox = await page.locator('#constellation-stage').boundingBox();
        const guideBox = await page.locator('.cover-bottom-bar').boundingBox();
        expect(creditBox).not.toBeNull();
        expect(gearsBox).not.toBeNull();
        expect(guideBox).not.toBeNull();
        if (creditBox && gearsBox && guideBox) {
          expect(creditBox.y + creditBox.height).toBeLessThan(gearsBox.y + 10);
          expect(guideBox.y).toBeGreaterThan(gearsBox.y + gearsBox.height - 10);
        }
      }

      if (vp.screenshot) {
        await captureStableScreenshot(page, page, `cover_ux_02_${vp.label}.png`);
      }
    }

    // Verificar integridad de las páginas 01–09
    for (const route of [
      '/introduccion',
      '/sistema',
      '/lider-proceso',
      '/anatomia-proceso',
      '/gestion-visual',
      '/kanban-concepto',
      '/kanban-flujo',
      '/kpi-concepto',
      '/kpi-gestion-diaria',
    ]) {
      const resp = await page.goto(route);
      expect(resp?.status()).toBe(200);
    }
  });
});
