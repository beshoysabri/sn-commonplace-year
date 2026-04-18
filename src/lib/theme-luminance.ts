/**
 * Narrow helper for Paper Mode only: reads --sn-stylekit-background-color
 * at call-time and returns whether SN's active theme has a dark background.
 *
 * Deliberately NOT used to switch base theming — SN's own vars already
 * do that through the light fallbacks in styles.css. This only picks
 * which parchment variant Paper Mode paints: warm cream for light SN
 * themes, candle-lit leather for dark ones.
 */

export function readSnThemeIsDark(): boolean {
  const bg = getComputedStyle(document.documentElement)
    .getPropertyValue('--sn-stylekit-background-color')
    .trim();
  if (!bg) return false;
  const probe = document.createElement('div');
  probe.style.color = bg;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  const m = computed.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (!m) return false;
  const luminance =
    (0.299 * Number(m[1]) + 0.587 * Number(m[2]) + 0.114 * Number(m[3])) / 255;
  return luminance < 0.5;
}

/** Event name dispatched by sn-api whenever SN (re)activates themes. */
export const SN_THEME_CHANGED_EVENT = 'sn-theme-changed';
