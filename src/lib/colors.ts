// Muted, jewel-toned palette suited to a commonplace-book aesthetic.
// Each color works against both light and dark SN themes.

export interface PaletteColor {
  name: string;
  hex: string;
}

export const PALETTE: readonly PaletteColor[] = [
  { name: 'Ocean', hex: '#4C6B8A' },
  { name: 'Indigo', hex: '#7C3AED' },
  { name: 'Wine', hex: '#9B2335' },
  { name: 'Rose', hex: '#E5879A' },
  { name: 'Amber', hex: '#C19A3E' },
  { name: 'Olive', hex: '#6B8E23' },
  { name: 'Moss', hex: '#2E7D32' },
  { name: 'Teal', hex: '#3E8E8E' },
  { name: 'Slate', hex: '#5C6B73' },
  { name: 'Rust', hex: '#B85B3A' },
  { name: 'Parchment', hex: '#D4A574' },
  { name: 'Ink', hex: '#2B2724' },
] as const;

export const DEFAULT_SOURCE_COLOR = '#4C6B8A';
export const DEFAULT_THEME_COLOR = '#6B8E23';
export const DEFAULT_REFERENCE_COLOR = '#5C6B73';

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
