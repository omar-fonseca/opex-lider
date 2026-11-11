/**
 * GearThemeBridge.ts
 * Synchronizes OPEX LÍDER's 4 palettes (blue, orange, red, green) and
 * 2 themes (dark, light) with Three.js metallic materials and scene lighting.
 */

export type GearAccentName = 'blue' | 'orange' | 'red' | 'green';
export type GearThemeMode = 'dark' | 'light';

export interface GearVisualPalette {
  theme: GearThemeMode;
  accent: GearAccentName;
  accentHex: number;
  accentBrightHex: number;
  centralMetalHex: number;
  secondaryMetalHex: number;
  collarMetalHex: number;
  recessedCoreHex: number;
  keyLightHex: number;
  warmRimLightHex: number;
  coolRimLightHex: number;
  ambientLightHex: number;
  metalness: number;
  roughness: number;
}

const ACCENT_HEX_MAP: Record<GearAccentName, { main: number; bright: number; coolRim: number }> = {
  blue: {
    main: 0x0ea5e9,
    bright: 0x38bdf8,
    coolRim: 0x38bdf8,
  },
  orange: {
    main: 0xf97316,
    bright: 0xfb923c,
    coolRim: 0xfbbf24,
  },
  red: {
    main: 0xf43f5e,
    bright: 0xfb7185,
    coolRim: 0xfda4af,
  },
  green: {
    main: 0x10b981,
    bright: 0x34d399,
    coolRim: 0x6ee7b7,
  },
};

export function resolveGearVisualPalette(
  theme: GearThemeMode = 'dark',
  accent: GearAccentName = 'blue'
): GearVisualPalette {
  const safeAccent: GearAccentName = ACCENT_HEX_MAP[accent] ? accent : 'blue';
  const safeTheme: GearThemeMode = theme === 'light' ? 'light' : 'dark';
  const accentColors = ACCENT_HEX_MAP[safeAccent];

  if (safeTheme === 'light') {
    return {
      theme: 'light',
      accent: safeAccent,
      accentHex: accentColors.main,
      accentBrightHex: accentColors.bright,
      centralMetalHex: 0xd8e2ef,
      secondaryMetalHex: 0xcbd5e1,
      collarMetalHex: 0xe2e8f0,
      // Keep the recessed inner hub deep slate/navy so white/bright labels stay crisp in light mode
      recessedCoreHex: 0x0c1629,
      keyLightHex: 0xffffff,
      warmRimLightHex: 0xffc58a,
      coolRimLightHex: accentColors.coolRim,
      ambientLightHex: 0x94a3b8,
      metalness: 0.78,
      roughness: 0.26,
    };
  }

  return {
    theme: 'dark',
    accent: safeAccent,
    accentHex: accentColors.main,
    accentBrightHex: accentColors.bright,
    centralMetalHex: 0xb8c7da,
    secondaryMetalHex: 0xaabaca,
    collarMetalHex: 0xd0dceb,
    recessedCoreHex: 0x050b16,
    keyLightHex: 0xf8fafc,
    warmRimLightHex: 0xffb36b,
    coolRimLightHex: accentColors.coolRim,
    ambientLightHex: 0x475569,
    metalness: 0.84,
    roughness: 0.24,
  };
}

export function readCurrentDocumentGearPalette(): GearVisualPalette {
  if (typeof document === 'undefined') {
    return resolveGearVisualPalette('dark', 'blue');
  }
  const root = document.documentElement;
  const rawTheme = (root.getAttribute('data-theme') || 'dark') as GearThemeMode;
  const rawAccent = (root.getAttribute('data-accent') || 'blue') as GearAccentName;
  return resolveGearVisualPalette(rawTheme, rawAccent);
}

/**
 * Observes `data-theme` and `data-accent` mutations on `document.documentElement`
 * and invokes `onChange` whenever the user switches palette or theme.
 */
export function observeDocumentGearPalette(
  onChange: (palette: GearVisualPalette) => void
): () => void {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {};
  }
  const root = document.documentElement;
  const observer = new MutationObserver(() => {
    onChange(readCurrentDocumentGearPalette());
  });
  observer.observe(root, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-accent'],
  });
  return () => observer.disconnect();
}
