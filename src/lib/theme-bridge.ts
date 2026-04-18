/**
 * Theme bridge — resolves the active theme-type so `[data-sn-theme="dark"]`
 * rules in styles.css always reflect SN's choice (not the OS preference).
 *
 * Order of precedence:
 *   1. SN's injected --sn-stylekit-theme-type (set by the loaded theme CSS).
 *   2. The OS prefers-color-scheme media query (standalone dev only).
 *
 * SN's theme stylesheets load async via <link> injection in sn-api.ts.
 * Call `refreshSnThemeType()` after those sheets load to pick up the
 * authoritative value.
 */

export type SnThemeType = 'light' | 'dark';

function readStylekitThemeType(): SnThemeType | null {
  // Prefer the explicit var when SN's theme CSS sets one.
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--sn-stylekit-theme-type')
    .trim()
    .replace(/^["']|["']$/g, '');
  if (raw === 'dark' || raw === 'light') return raw;
  // Fall back to inferring from --sn-stylekit-background-color. SN's built-in
  // themes often skip --sn-stylekit-theme-type but always set the background,
  // so luminance is a reliable signal when the explicit var is absent.
  return inferFromStylekitBackground();
}

function inferFromStylekitBackground(): SnThemeType | null {
  const bg = getComputedStyle(document.documentElement)
    .getPropertyValue('--sn-stylekit-background-color')
    .trim();
  if (!bg) return null;
  // Normalize via the browser's color parser (handles #fff, rgb(), named).
  const probe = document.createElement('div');
  probe.style.color = bg;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  const m = computed.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (!m) return null;
  const luminance =
    (0.299 * Number(m[1]) + 0.587 * Number(m[2]) + 0.114 * Number(m[3])) / 255;
  return luminance < 0.5 ? 'dark' : 'light';
}

function osPreference(): SnThemeType {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function applyThemeType(type: SnThemeType) {
  document.documentElement.dataset.snTheme = type;
}

/**
 * Pick the current theme-type and stamp it on <html>. Safe to call
 * repeatedly; SN's var wins when present, OS preference otherwise.
 */
export function refreshSnThemeType(): SnThemeType {
  const resolved = readStylekitThemeType() ?? osPreference();
  applyThemeType(resolved);
  return resolved;
}

/**
 * Set an initial value before SN loads its themes (so the first paint isn't
 * a flicker), and track OS changes while standalone — SN's own calls to
 * refreshSnThemeType() will override this once an SN theme activates.
 */
export function installThemeBridge() {
  refreshSnThemeType();

  const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
  mq?.addEventListener?.('change', () => {
    if (!readStylekitThemeType()) {
      applyThemeType(osPreference());
    }
  });
}
