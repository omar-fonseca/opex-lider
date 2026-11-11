/**
 * OPEX LÍDER — VISUAL-3D-04 (Fase 4 · Capa 5: Adaptación de Temas y Paletas)
 * Traduce los tokens de tema ('dark' | 'light') y las 4 paletas de acento
 * ('blue' | 'orange' | 'red' | 'green') en colores hexadecimales para materiales e iluminación 3D.
 */

export type OpexThemeMode = 'dark' | 'light';
export type OpexAccentPalette = 'blue' | 'orange' | 'red' | 'green';

export interface ThreeThemeTokens {
  theme: OpexThemeMode;
  accent: OpexAccentPalette;
  sceneBackground: number;
  floorGridMain: number;
  floorGridSub: number;
  ambientLightColor: number;
  ambientIntensity: number;
  dirLightColor: number;
  dirIntensity: number;
  accentPrimary: number;
  accentHighlight: number;
  accentEmissive: number;
  neutralSurface: number;
  neutralSubtle: number;
  neutralCore: number;
  feedbackColor: number;
  feedbackEmissive: number;
}

const ACCENT_HEX_MAP: Record<
  OpexAccentPalette,
  { darkPrimary: number; darkHighlight: number; lightPrimary: number; lightHighlight: number }
> = {
  blue: {
    darkPrimary: 0x3b82f6,
    darkHighlight: 0x60a5fa,
    lightPrimary: 0x2563eb,
    lightHighlight: 0x3b82f6,
  },
  orange: {
    darkPrimary: 0xf97316,
    darkHighlight: 0xfb923c,
    lightPrimary: 0xea580c,
    lightHighlight: 0xf97316,
  },
  red: {
    darkPrimary: 0xef4444,
    darkHighlight: 0xf87171,
    lightPrimary: 0xdc2626,
    lightHighlight: 0xef4444,
  },
  green: {
    darkPrimary: 0x10b981,
    darkHighlight: 0x34d399,
    lightPrimary: 0x059669,
    lightHighlight: 0x10b981,
  },
};

export function resolveThreeThemeTokens(
  theme: OpexThemeMode = 'dark',
  accent: OpexAccentPalette = 'blue'
): ThreeThemeTokens {
  const safeTheme: OpexThemeMode = theme === 'light' ? 'light' : 'dark';
  const safeAccent: OpexAccentPalette =
    accent in ACCENT_HEX_MAP ? accent : 'blue';
  const palette = ACCENT_HEX_MAP[safeAccent];

  if (safeTheme === 'light') {
    return {
      theme: 'light',
      accent: safeAccent,
      sceneBackground: 0xf1f5f9,
      floorGridMain: 0x94a3b8,
      floorGridSub: 0xcbd5e1,
      ambientLightColor: 0xffffff,
      ambientIntensity: 1.35,
      dirLightColor: 0xffffff,
      dirIntensity: 1.55,
      accentPrimary: palette.lightPrimary,
      accentHighlight: palette.lightHighlight,
      accentEmissive: palette.lightPrimary,
      neutralSurface: 0xffffff,
      neutralSubtle: 0xe2e8f0,
      neutralCore: 0x334155,
      feedbackColor: 0x0d9488,
      feedbackEmissive: 0x0f766e,
    };
  }

  return {
    theme: 'dark',
    accent: safeAccent,
    sceneBackground: 0x091326,
    floorGridMain: 0x1e3a6d,
    floorGridSub: 0x13264a,
    ambientLightColor: 0xdbeafe,
    ambientIntensity: 1.05,
    dirLightColor: 0xffffff,
    dirIntensity: 1.65,
    accentPrimary: palette.darkPrimary,
    accentHighlight: palette.darkHighlight,
    accentEmissive: palette.darkPrimary,
    neutralSurface: 0x16294c,
    neutralSubtle: 0x1e3560,
    neutralCore: 0xe2e8f0,
    feedbackColor: 0x10b981,
    feedbackEmissive: 0x059669,
  };
}

export function readDocumentThemeAndAccent(): {
  theme: OpexThemeMode;
  accent: OpexAccentPalette;
} {
  if (typeof document === 'undefined') {
    return { theme: 'dark', accent: 'blue' };
  }
  const root = document.documentElement;
  const rawTheme = root.getAttribute('data-theme');
  const rawAccent = root.getAttribute('data-accent');
  return {
    theme: rawTheme === 'light' ? 'light' : 'dark',
    accent:
      rawAccent === 'orange' || rawAccent === 'red' || rawAccent === 'green'
        ? rawAccent
        : 'blue',
  };
}

export function observeThemeAndAccentChanges(
  onChange: (tokens: ThreeThemeTokens) => void
): () => void {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {};
  }
  const emitCurrent = () => {
    const { theme, accent } = readDocumentThemeAndAccent();
    onChange(resolveThreeThemeTokens(theme, accent));
  };

  const observer = new MutationObserver(() => {
    emitCurrent();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-accent'],
  });

  return () => {
    observer.disconnect();
  };
}
