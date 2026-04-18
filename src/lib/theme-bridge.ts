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
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--sn-stylekit-theme-type')
    .trim()
    .replace(/^["']|["']$/g, '');
  if (raw === 'dark' || raw === 'light') return raw;
  return null;
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
