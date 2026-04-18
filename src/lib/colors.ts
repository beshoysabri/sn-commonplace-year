// Shared 18-color palette used across the sn-* plugin family (kanban,
// habit, goal, commonplace). Grouped by hue so the swatch grid reads
// as a rainbow — each color works against both light and dark SN themes.

export interface PaletteColor {
  name: string;
  hex: string;
}

export const PALETTE: readonly PaletteColor[] = [
  // Yellows
  { name: 'Lemon', hex: '#FFF689' },
  { name: 'Mustard', hex: '#F4D35E' },
  // Oranges
  { name: 'Peach', hex: '#FFB88A' },
  { name: 'Tangerine', hex: '#FF9C5B' },
  { name: 'Flame', hex: '#F67B45' },
  // Pinks/Reds
  { name: 'Blush', hex: '#FBC2C2' },
  { name: 'Rose', hex: '#E39B99' },
  { name: 'Berry', hex: '#CB7876' },
  // Greens
  { name: 'Sage', hex: '#B4CFA4' },
  { name: 'Fern', hex: '#8BA47C' },
  { name: 'Forest', hex: '#62866C' },
  // Blues
  { name: 'Sky', hex: '#A0C5E3' },
  { name: 'Steel', hex: '#81B2D9' },
  { name: 'Ocean', hex: '#32769B' },
  // Purples
  { name: 'Lavender', hex: '#BBA6DD' },
  { name: 'Mauve', hex: '#8C7DA8' },
  { name: 'Plum', hex: '#64557B' },
  // Dark
  { name: 'Midnight', hex: '#1E2136' },
] as const;

export const DEFAULT_SOURCE_COLOR = '#32769B'; // Ocean
export const DEFAULT_THEME_COLOR = '#62866C'; // Forest
export const DEFAULT_REFERENCE_COLOR = '#64557B'; // Plum

/**
 * Deterministic color picker from a string (e.g. source name) — used as
 * a fallback when the user hasn't picked a color. Hashes into PALETTE.
 */
export function colorFromString(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % PALETTE.length;
  return PALETTE[idx].hex;
}

/**
 * Hex → rgba() with explicit alpha. Accepts #RGB, #RRGGBB; ignores others.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '').trim();
  let r = 0,
    g = 0,
    b = 0;
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
  } else if (h.length === 6) {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  } else {
    return `rgba(0,0,0,${alpha})`;
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Returns "#000" or "#fff" for good contrast against the given hex.
 * Uses the standard luminance formula.
 */
export function contrastColor(hex: string): string {
  const h = hex.replace('#', '');
  let r = 0,
    g = 0,
    b = 0;
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
  } else if (h.length === 6) {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  }
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#2B2724' : '#FDFBF7';
}
