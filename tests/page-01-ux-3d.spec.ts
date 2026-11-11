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

test.describe('OPEX LÍDER — PAGE-01-UX-3D-01 + PAGE-01-UX-3D-02: Evolución editorial 3D, presupuesto vertical a zoom 100% y Modo Auditorio (Página 01)', () => {
  test('1. Zoom 100% encuadrado sin recortes (1440x900 y 1366x768), conservación de los 4 textos, ilustraciones contextuales y transiciones 01-04', async ({
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
    const controlsBox = await page.locator('.intro-deck-controls').boundingBox();
    expect(stageBox).not.toBeNull();
    expect(activeCardBox).not.toBeNull();
    expect(controlsBox).not.toBeNull();
    if (stageBox && activeCardBox && controlsBox) {
      const widthRatio = activeCardBox.width / stageBox.width;
      expect(widthRatio).toBeGreaterThanOrEqual(0.7);
      expect(widthRatio).toBeLessThanOrEqual(0.85);

      // FASE 2: Al 100% de zoom en 1440x900 sin desplazar (scrollY=0),
      // la tarjeta protagonista y la barra inferior de controles deben quedar dentro del viewport visible (<= 900px)
      expect(activeCardBox.y + activeCardBox.height).toBeLessThanOrEqual(900);
      expect(controlsBox.y + controlsBox.height).toBeLessThanOrEqual(900);
    }

    // Captura al 100% de zoom en escritorio 1440x900
    await page.evaluate(() => window.scrollTo(0, 0));
    await captureScreenshot(page, 'page_01_ux_3d_card_01_desktop.png');
    await captureScreenshot(page, 'page_01_ux_3d_02_after_100zoom_1440x900.png');

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

    await page.locator('#intro-deck-prev-btn').click();
    await expect(workbench).toHaveAttribute('data-active-index', '0');
    await expect(playBtn).toHaveAttribute('aria-pressed', 'false');

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('2. Modo Auditorio (16:9 y 4:3) con tarjeta protagonista máxima, explicación abierta sin desbordar, 4 paletas y 2 temas', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/introduccion');

    const workbench = page.locator('#intro-cards-workbench');

    // Activar Modo Auditorio en 1920x1080 (16:9)
    await page.locator('#intro-pres-enter-btn').click();
    await expect(workbench).toHaveAttribute('data-presentation-mode', 'true');
    await expect(page.locator('#intro-pres-topbar')).toBeVisible();

    // Verificar que la tarjeta protagonista ocupa el área dominante (>= 80% del escenario) y controles encuadran sin desbordar
    const presMetrics169 = await page.evaluate(() => {
      const wb = document.getElementById('intro-cards-workbench')!;
      const stage = document.getElementById('intro-deck-stage')!;
      const card = document.getElementById('intro-card-01')!;
      const controls = document.querySelector('.intro-deck-controls')!;
      const titleEl = card.querySelector('.intro-card-title')!;
      const paraEl = card.querySelector('.intro-card-paragraph')!;
      const stageRect = stage.getBoundingClientRect();
      const controlsRect = controls.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      return {
        wbScrollHeight: wb.scrollHeight,
        wbClientHeight: wb.clientHeight,
        controlsBottom: controlsRect.bottom,
        cardBottom: cardRect.bottom,
        cardWidthRatio: cardRect.width / stageRect.width,
        titleFontSize: parseFloat(window.getComputedStyle(titleEl).fontSize),
        paraFontSize: parseFloat(window.getComputedStyle(paraEl).fontSize),
      };
    });
    expect(presMetrics169.cardWidthRatio).toBeGreaterThanOrEqual(0.8);
    expect(presMetrics169.controlsBottom).toBeLessThanOrEqual(1080);
    expect(presMetrics169.cardBottom).toBeLessThanOrEqual(1080);
    expect(presMetrics169.wbScrollHeight).toBeLessThanOrEqual(presMetrics169.wbClientHeight + 2);
    expect(presMetrics169.titleFontSize).toBeGreaterThanOrEqual(32);
    expect(presMetrics169.paraFontSize).toBeGreaterThanOrEqual(20);

    await captureScreenshot(page, 'page_01_ux_3d_auditorium_16_9.png');
    await captureScreenshot(page, 'page_01_ux_3d_02_after_auditorium_16_9.png');

    // Verificar explicación contextual abierta DENTRO de Modo Auditorio sin desbordar el marco ni ocultar controles
    await page.locator('#intro-card-01 .intro-illus-explain-btn').click();
    await expect(page.locator('#intro-illus-panel-0')).toBeVisible();
    const expInPres169 = await page.evaluate(() => {
      const wb = document.getElementById('intro-cards-workbench')!;
      const controls = document.querySelector('.intro-deck-controls')!;
      return {
        wbScrollHeight: wb.scrollHeight,
        wbClientHeight: wb.clientHeight,
        controlsBottom: controls.getBoundingClientRect().bottom,
      };
    });
    expect(expInPres169.wbScrollHeight).toBeLessThanOrEqual(expInPres169.wbClientHeight + 2);
    expect(expInPres169.controlsBottom).toBeLessThanOrEqual(1080);
    await captureScreenshot(page, 'page_01_ux_3d_02_auditorium_16_9_explained.png');

    // Cerrar explicación y avanzar con tecla Flecha Derecha dentro del modo auditorio
    await page.locator('#intro-card-01 .intro-illus-exp-close').click();
    await page.keyboard.press('ArrowRight');
    await expect(workbench).toHaveAttribute('data-active-index', '1');

    // Cambiar a resolución 4:3 de proyector (1440x1080): verificar tarjeta protagonista a ancho completo y controles visibles
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.waitForTimeout(80);
    const metrics43 = await page.evaluate(() => {
      const wb = document.getElementById('intro-cards-workbench')!;
      const stage = document.getElementById('intro-deck-stage')!;
      const card = document.getElementById('intro-card-02')!;
      const controls = document.querySelector('.intro-deck-controls')!;
      const titleEl = card.querySelector('.intro-card-title')!;
      const paraEl = card.querySelector('.intro-card-paragraph')!;
      return {
        wbScrollHeight: wb.scrollHeight,
        wbClientHeight: wb.clientHeight,
        cardWidthRatio: card.getBoundingClientRect().width / stage.getBoundingClientRect().width,
        controlsBottom: controls.getBoundingClientRect().bottom,
        titleFontSize: parseFloat(window.getComputedStyle(titleEl).fontSize),
        paraFontSize: parseFloat(window.getComputedStyle(paraEl).fontSize),
      };
    });
    expect(metrics43.cardWidthRatio).toBeGreaterThanOrEqual(0.95);
    expect(metrics43.controlsBottom).toBeLessThanOrEqual(1080);
    expect(metrics43.wbScrollHeight).toBeLessThanOrEqual(metrics43.wbClientHeight + 2);
    expect(metrics43.titleFontSize).toBeGreaterThanOrEqual(32);
    expect(metrics43.paraFontSize).toBeGreaterThanOrEqual(20);
    await captureScreenshot(page, 'page_01_ux_3d_02_after_auditorium_4_3_single.png');

    // Activar Vista 4 tarjetas en 4:3 (1440x1080)
    await page.locator('#intro-pres-overview-btn').click();
    await expect(workbench).toHaveAttribute('data-presentation-overview', 'true');
    const overviewControlsRect = await page.locator('.intro-deck-controls').boundingBox();
    expect(overviewControlsRect).not.toBeNull();
    if (overviewControlsRect) {
      expect(overviewControlsRect.y + overviewControlsRect.height).toBeLessThanOrEqual(1080);
    }
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

  test('3. Validación de 9 resoluciones obligatorias, zoom real (90%, 100%, 110%, 125% con deviceScaleFactor) y cero regresiones en 00 y 02-09', async ({
    browser,
    page,
  }) => {
    await page.goto('/introduccion');

    // Las 9 resoluciones obligatorias
    const viewports = [
      { width: 360, height: 800, label: 'mobile_360px', screenshot: true },
      { width: 390, height: 844, label: 'mobile_390px', screenshot: false },
      { width: 768, height: 1024, label: 'tablet_768px', screenshot: true },
      { width: 820, height: 1180, label: 'tablet_820px', screenshot: false },
      { width: 1366, height: 768, label: 'laptop_1366x768', screenshot: true },
      { width: 1280, height: 800, label: 'laptop_1280x800', screenshot: false },
      { width: 1440, height: 900, label: 'desktop_1440x900', screenshot: false },
      { width: 1920, height: 1080, label: 'presentation_1920x1080', screenshot: false },
      { width: 1440, height: 1080, label: 'presentation_1440x1080', screenshot: false },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(60);

      const overflowCheck = await page.evaluate(() => {
        const doc = document.documentElement;
        const controls = document.querySelector('.intro-deck-controls');
        const controlsRect = controls?.getBoundingClientRect();
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          controlsBottom: controlsRect ? controlsRect.bottom : 0,
        };
      });

      expect(
        overflowCheck.scrollWidth,
        `Overflow horizontal en ${vp.label} (${vp.width}x${vp.height}): scrollWidth=${overflowCheck.scrollWidth} > clientWidth=${overflowCheck.clientWidth}`
      ).toBeLessThanOrEqual(overflowCheck.clientWidth + 1);

      if (vp.width >= 1280) {
        expect(
          overflowCheck.controlsBottom,
          `Los controles inferiores quedan fuera del viewport inicial en ${vp.label} (${vp.width}x${vp.height})`
        ).toBeLessThanOrEqual(vp.height + 2);
      }

      if (vp.width <= 720) {
        await expect(page.locator('#intro-card-01')).toBeVisible();
        await expect(page.locator('#intro-card-02')).toBeHidden();
      }

      if (vp.screenshot) {
        await captureScreenshot(page, `page_01_ux_3d_${vp.label}.png`);
      }
    }

    // Validación de zoom real equivalente (90%, 100%, 110%, 125% con viewport efectivo y deviceScaleFactor)
    // tanto en lectura normal como en Modo Auditorio con explicación desplegada (incluido 1366x768 a 125%)
    const zoomMatrix = [
      { label: '90%_1440x900', width: 1600, height: 1000, dpr: 0.9 },
      { label: '100%_1440x900', width: 1440, height: 900, dpr: 1.0 },
      { label: '110%_1440x900', width: 1309, height: 818, dpr: 1.1 },
      { label: '125%_1440x900', width: 1152, height: 720, dpr: 1.25 },
      { label: '125%_1366x768', width: 1093, height: 614, dpr: 1.25 },
    ];

    for (const z of zoomMatrix) {
      const zoomCtx = await browser.newContext({
        baseURL: 'http://127.0.0.1:4321',
        viewport: { width: z.width, height: z.height },
        deviceScaleFactor: z.dpr,
      });
      const zPage = await zoomCtx.newPage();
      await zPage.goto('/introduccion');
      await zPage.waitForTimeout(80);

      // 1) Lectura normal accesible y sin overflow horizontal
      const normalMetrics = await zPage.evaluate(() => {
        const doc = document.documentElement;
        const cardTitle = document.querySelector('#intro-card-01 .intro-card-title');
        const cardPara = document.querySelector('#intro-card-01 .intro-card-paragraph');
        const nextBtn = document.getElementById('intro-deck-next-btn');
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          titleVisible: Boolean(cardTitle && cardTitle.getBoundingClientRect().height > 0),
          paraVisible: Boolean(cardPara && cardPara.getBoundingClientRect().height > 0),
          nextBtnVisible: Boolean(nextBtn && nextBtn.getBoundingClientRect().height > 0),
        };
      });
      expect(normalMetrics.scrollWidth, `Overflow a zoom ${z.label}`).toBeLessThanOrEqual(
        normalMetrics.clientWidth + 1
      );
      expect(normalMetrics.titleVisible).toBe(true);
      expect(normalMetrics.paraVisible).toBe(true);
      expect(normalMetrics.nextBtnVisible).toBe(true);

      // 2) Modo Auditorio con explicación desplegada sin desbordar el marco exterior ni cortar controles
      await zPage.locator('#intro-pres-enter-btn').click();
      await zPage.locator('#intro-card-01 .intro-illus-explain-btn').click();
      await zPage.waitForTimeout(80);
      const presMetrics = await zPage.evaluate(() => {
        const wb = document.getElementById('intro-cards-workbench')!;
        const controls = document.querySelector('.intro-deck-controls')!;
        return {
          wbScrollHeight: wb.scrollHeight,
          wbClientHeight: wb.clientHeight,
          controlsBottom: controls.getBoundingClientRect().bottom,
          vpHeight: window.innerHeight,
        };
      });
      expect(
        presMetrics.wbScrollHeight,
        `Desbordamiento externo en Modo Auditorio con explicación a zoom ${z.label}`
      ).toBeLessThanOrEqual(presMetrics.wbClientHeight + 2);
      expect(presMetrics.controlsBottom).toBeLessThanOrEqual(presMetrics.vpHeight + 2);

      await zoomCtx.close();
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
