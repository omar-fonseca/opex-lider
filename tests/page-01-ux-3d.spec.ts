import { test, expect, type Page, type Locator } from '@playwright/test';
import path from 'node:path';

const ARTIFACT_DIR = 'C:/Users/ASUS/.gemini/antigravity/brain/02080c1d-f22a-44d0-b278-ec9c7c869d80';

async function captureScreenshot(target: Page | Locator, filename: string) {
  await target.screenshot({
    path: path.join(ARTIFACT_DIR, filename),
    animations: 'disabled',
  });
}

const EXPECTED_CARDS = [
  {
    index: 0,
    number: '01',
    title: 'El espejismo de las herramientas',
    paragraph:
      'Implementar 5S, tableros Kanban o rutinas de supervisión sin clarificar su propósito genera fatiga y burocracia. Las herramientas solo cobran sentido cuando responden a un problema real de la operación y cuando el equipo entiende qué brecha busca cerrar.',
  },
  {
    index: 1,
    number: '02',
    title: 'El sistema como totalidad viva',
    paragraph:
      'Una desviación en calidad o un retraso en entrega rara vez es un fallo individual. Con frecuencia involucra el diseño del flujo, la claridad del estándar, el ritmo de los insumos y la forma en que el líder reacciona frente al error. Quien solo mira la pieza pierde de vista el engranaje.',
  },
  {
    index: 2,
    number: '03',
    title: 'Seguridad para cuestionar',
    paragraph:
      'Ningún estándar se mantiene vivo sin personas dispuestas a levantar la mano ante una anomalía. Cuando un entorno castiga el error, los problemas no desaparecen: se ocultan hasta convertirse en crisis. La excelencia exige confianza técnica y psicológica en la línea de trabajo.',
  },
  {
    index: 3,
    number: '04',
    title: 'De la intuición a la evidencia',
    paragraph:
      'Aprender en las operaciones significa sustituir las opiniones jerárquicas por datos contrastados en el Gemba (el lugar real). Cada desviación deja de ser una molestia y pasa a ser información privilegiada para ajustar el proceso con rigor y disciplina.',
  },
];

test.describe('OPEX LÍDER — PAGE-01-UX-3D-01: Evolución editorial 3D de las 4 tarjetas (Página 01)', () => {
  test('1. Conservación íntegra de los 4 textos, tamaño protagonista (70-85%), ilustraciones contextuales y transiciones 01-04', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/introduccion');

    const workbench = page.locator('#intro-cards-workbench');
    await expect(workbench).toBeVisible();
    await expect(workbench).toHaveAttribute('data-active-index', '0');
    await expect(workbench).toHaveAttribute('data-autoplay', 'false');

    // Verificar tamaño de la tarjeta protagonista (entre 70% y 85% del escenario en escritorio)
    const stageBox = await page.locator('#intro-deck-stage').boundingBox();
    const activeCardBox = await page.locator('#intro-card-01').boundingBox();
    expect(stageBox).not.toBeNull();
    expect(activeCardBox).not.toBeNull();
    if (stageBox && activeCardBox) {
      const widthRatio = activeCardBox.width / stageBox.width;
      expect(widthRatio).toBeGreaterThanOrEqual(0.7);
      expect(widthRatio).toBeLessThanOrEqual(0.85);
    }

    // Captura inicial Tarjeta 01 en escritorio
    await page.evaluate(() => window.scrollTo(0, 0));
    await captureScreenshot(page, 'page_01_ux_3d_card_01_desktop.png');

    // Probar explicación contextual de la ilustración 01 (abrir y cerrar con Escape)
    const illusBtn0 = page.locator('.intro-illus-explain-btn[data-illus-toggle="0"]');
    const illusPanel0 = page.locator('#intro-illus-panel-0');
    await expect(illusPanel0).toBeHidden();
    await illusBtn0.click();
    await expect(illusPanel0).toBeVisible();
    await expect(illusBtn0).toHaveAttribute('aria-expanded', 'true');
    await captureScreenshot(workbench, 'page_01_ux_3d_illustration_explained.png');

    await page.keyboard.press('Escape');
    await expect(illusPanel0).toBeHidden();
    await expect(illusBtn0).toHaveAttribute('aria-expanded', 'false');

    // Recorrer las 4 tarjetas verificando su título, párrafo íntegro e ilustración asociada
    for (let i = 0; i < EXPECTED_CARDS.length; i++) {
      const expected = EXPECTED_CARDS[i];
      if (i > 0) {
        await page.locator('#intro-deck-next-btn').click();
      }
      await expect(workbench).toHaveAttribute('data-active-index', String(i));
      const cardEl = page.locator(`#intro-card-0${i + 1}`);
      await expect(cardEl).toHaveAttribute('data-card-state', 'active');
      await expect(cardEl.locator('.intro-card-title')).toHaveText(expected.title);
      await expect(cardEl.locator('.intro-card-paragraph')).toHaveText(expected.paragraph);
      await expect(cardEl.locator('svg.intro-edu-svg')).toBeVisible();

      if (i > 0) {
        await captureScreenshot(workbench, `page_01_ux_3d_card_0${i + 1}_desktop.png`);
      }
    }

    // Seleccionar tarjeta mediante clic en pestaña superior y clic en tarjeta secundaria en profundidad
    await page.locator('#intro-tab-0').click();
    await expect(workbench).toHaveAttribute('data-active-index', '0');

    // Clic sobre la tarjeta secundaria 02 en profundidad para traerla al frente
    await page.locator('#intro-card-02').click();
    await expect(workbench).toHaveAttribute('data-active-index', '1');

    // Navegación por teclado (ArrowRight / ArrowLeft) en las pestañas
    await page.locator('#intro-tab-1').focus();
    await page.keyboard.press('ArrowRight');
    await expect(workbench).toHaveAttribute('data-active-index', '2');
    await page.keyboard.press('ArrowLeft');
    await expect(workbench).toHaveAttribute('data-active-index', '1');

    // Verificar Play/Pausa (inicialmente desactivado, se activa y se pausa al interactuar manualmente)
    const playBtn = page.locator('#intro-deck-play-btn');
    await expect(playBtn).toHaveAttribute('aria-pressed', 'false');
    await playBtn.click();
    await expect(playBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(workbench).toHaveAttribute('data-autoplay', 'true');

    // Al pulsar Anterior manualmente, el autoplay se detiene para respetar la lectura
    await page.locator('#intro-deck-prev-btn').click();
    await expect(workbench).toHaveAttribute('data-active-index', '0');
    await expect(playBtn).toHaveAttribute('aria-pressed', 'false');

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('2. Modo Presentación para Auditorios (16:9 y 4:3), Vista General de 4 tarjetas, 4 paletas y 2 temas', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/introduccion');

    const workbench = page.locator('#intro-cards-workbench');

    // Activar Modo Auditorio en 1920x1080 (16:9)
    await page.locator('#intro-pres-enter-btn').click();
    await expect(workbench).toHaveAttribute('data-presentation-mode', 'true');
    await expect(page.locator('#intro-pres-topbar')).toBeVisible();
    await captureScreenshot(page, 'page_01_ux_3d_auditorium_16_9.png');

    // Avanzar con tecla Flecha Derecha dentro del modo auditorio
    await page.keyboard.press('ArrowRight');
    await expect(workbench).toHaveAttribute('data-active-index', '1');

    // Cambiar a resolución 4:3 de proyector (1440x1080) y activar Vista 4 tarjetas
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.locator('#intro-pres-overview-btn').click();
    await expect(workbench).toHaveAttribute('data-presentation-overview', 'true');
    await captureScreenshot(page, 'page_01_ux_3d_auditorium_4_3_overview.png');

    // Salir del Modo Auditorio con Escape y verificar restauración
    await page.keyboard.press('Escape');
    await expect(workbench).not.toHaveAttribute('data-presentation-mode', 'true');

    // Probar las 4 paletas y los 2 temas en escritorio (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('#intro-tab-0').click();
    await page.evaluate(() => window.scrollTo(0, 0));

    const paletteToggle = page.locator('#palette-toggle-btn');
    for (const accent of ['orange', 'red', 'green', 'blue']) {
      await paletteToggle.click();
      await page.locator(`.palette-swatch[data-accent-value="${accent}"]`).click();
      await expect(page.locator('html')).toHaveAttribute('data-accent', accent);
      if (accent === 'green') {
        await page.evaluate(() => window.scrollTo(0, 0));
        await captureScreenshot(page, 'page_01_ux_3d_palette_green.png');
      }
    }

    const themeBtn = page.locator('#theme-toggle-btn');
    await themeBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.evaluate(() => window.scrollTo(0, 0));
    await captureScreenshot(page, 'page_01_ux_3d_light_mode.png');
    await themeBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Verificar soporte de movimiento reducido (prefers-reduced-motion: reduce)
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#intro-tab-2').click();
    await expect(workbench).toHaveAttribute('data-active-index', '2');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  test('3. Validación responsive sin overflow horizontal (360, 390, 768, 820, 1024, 1280, 1440, 1920 + 4:3) y ausencia de regresiones en 00 y 02-09', async ({
    page,
  }) => {
    await page.goto('/introduccion');

    const viewports = [
      { width: 360, height: 800, label: 'mobile_360px', screenshot: true },
      { width: 390, height: 844, label: 'mobile_390px', screenshot: false },
      { width: 768, height: 1024, label: 'tablet_768px', screenshot: true },
      { width: 820, height: 1180, label: 'tablet_820px', screenshot: false },
      { width: 1024, height: 768, label: 'laptop_1024px', screenshot: false },
      { width: 1280, height: 800, label: 'laptop_1280px', screenshot: false },
      { width: 1440, height: 900, label: 'desktop_1440px', screenshot: false },
      { width: 1440, height: 1080, label: 'presentation_4_3', screenshot: false },
      { width: 1920, height: 1080, label: 'presentation_16_9', screenshot: false },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(60);

      const overflowCheck = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
        };
      });

      expect(
        overflowCheck.scrollWidth,
        `Overflow horizontal en ${vp.label} (${vp.width}x${vp.height}): scrollWidth=${overflowCheck.scrollWidth} > clientWidth=${overflowCheck.clientWidth}`
      ).toBeLessThanOrEqual(overflowCheck.clientWidth + 1);

      // En móvil (<= 720px), verificar que se muestra una tarjeta completa por vez
      if (vp.width <= 720) {
        await expect(page.locator('#intro-card-01')).toBeVisible();
        await expect(page.locator('#intro-card-02')).toBeHidden();
      }

      if (vp.screenshot) {
        await captureScreenshot(page, `page_01_ux_3d_${vp.label}.png`);
      }
    }

    // Verificar ausencia de regresiones en Página 00 y Páginas 02–09
    for (const route of [
      '/',
      '/sistema',
      '/lider-proceso',
      '/anatomia-proceso',
      '/gestion-visual',
      '/kanban-concepto',
      '/kanban-flujo',
      '/kpi-concepto',
      '/kpi-gestion-diaria',
    ]) {
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
    }
  });
});
