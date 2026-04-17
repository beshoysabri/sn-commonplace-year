import type {
  CommonplaceYear,
  Lesson,
  Source,
  Theme,
} from '../types/commonplace';
import { parseLocalDate, MONTHS_SHORT } from './dates';

export interface SummaryStats {
  total: number;
  important: number;
  untagged: number;
  sources: number;
  references: number;
  dated: number;
  /** fraction 0..1 */
  priorityRatio: number;
}

export function summaryStats(data: CommonplaceYear): SummaryStats {
  const total = data.lessons.length;
  const important = data.lessons.filter((l) => l.important).length;
  const untagged = data.lessons.filter((l) => l.themeIds.length === 0).length;
  const dated = data.lessons.filter((l) => !!l.date).length;
  return {
    total,
    important,
    untagged,
    sources: data.sources.length,
    references: data.references.length,
    dated,
    priorityRatio: total === 0 ? 0 : important / total,
  };
}

/**
 * Lessons per month (0..11) based on createdAt (or date if createdAt missing).
 * Returns length-12 arrays. `important` is a subset count.
 */
export function lessonsPerMonth(data: CommonplaceYear): Array<{
  month: string;
  total: number;
  important: number;
}> {
  const totals = new Array<number>(12).fill(0);
  const importants = new Array<number>(12).fill(0);
  for (const l of data.lessons) {
    const iso = l.createdAt || l.date;
    if (!iso) continue;
    const d = new Date(iso);
    if (Number.isNaN(d.valueOf())) continue;
    const m = d.getMonth();
    if (m < 0 || m > 11) continue;
    totals[m] += 1;
    if (l.important) importants[m] += 1;
  }
  return MONTHS_SHORT.map((name, i) => ({
    month: name,
    total: totals[i],
    important: importants[i],
  }));
}

/** Top N sources by citation count. */
export function topSources(
  data: CommonplaceYear,
  n = 10,
  importantOnly = false,
): Array<{ source: Source; count: number }> {
  const counts = new Map<string, number>();
  for (const l of data.lessons) {
    if (importantOnly && !l.important) continue;
    for (const id of l.sourceIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([id, count]) => {
      const s = data.sources.find((x) => x.id === id);
      return s ? { source: s, count } : null;
    })
    .filter((x): x is { source: Source; count: number } => !!x)
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/** Theme distribution (all + one pseudo bucket for untagged). */
export interface ThemeDistributionEntry {
  theme: Theme | null;
  name: string;
  color: string;
  count: number;
}

export function themeDistribution(
  data: CommonplaceYear,
  importantOnly = false,
): ThemeDistributionEntry[] {
  const counts = new Map<string, number>();
  let untagged = 0;
  for (const l of data.lessons) {
    if (importantOnly && !l.important) continue;
    if (l.themeIds.length === 0) {
      untagged += 1;
    } else {
      for (const id of l.themeIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  const themed: ThemeDistributionEntry[] = [...counts.entries()]
    .map(([id, count]): ThemeDistributionEntry | null => {
      const t = data.themes.find((x) => x.id === id);
      if (!t) return null;
      return { theme: t, name: t.name, color: t.color, count };
    })
    .filter((x): x is ThemeDistributionEntry => x !== null)
    .sort((a, b) => b.count - a.count);
  if (untagged > 0) {
    themed.push({
      theme: null,
      name: 'untagged',
      color: '#9ca3af',
      count: untagged,
    });
  }
  return themed;
}

/**
 * Cross-pollination: pairs of sources most often co-cited in the same lesson.
 * Returns top N pairs sorted by count desc.
 */
export function coCitationPairs(
  data: CommonplaceYear,
  n = 5,
): Array<{ a: Source; b: Source; count: number }> {
  const counts = new Map<string, number>();
  for (const l of data.lessons) {
    const ids = [...new Set(l.sourceIds)].sort();
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = `${ids[i]}|${ids[j]}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .map(([key, count]) => {
      const [aid, bid] = key.split('|');
      const a = data.sources.find((s) => s.id === aid);
      const b = data.sources.find((s) => s.id === bid);
      return a && b ? { a, b, count } : null;
    })
    .filter((x): x is { a: Source; b: Source; count: number } => !!x)
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/** How many lessons were written this year (i.e. not dated in another year). */
export function datedInYear(
  data: CommonplaceYear,
  lessons: Lesson[] = data.lessons,
): number {
  return lessons.filter((l) => {
    if (!l.date) return false;
    const d = parseLocalDate(l.date);
    return d.getFullYear() === data.year;
  }).length;
}
