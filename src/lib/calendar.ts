import type { ISODate, Lesson } from '../types/commonplace';
import { isoWeek, parseLocalDate } from './dates';

/** Build a 6-week grid for a given month (0-indexed), with day-of-month
 * numbers and null-padding for leading/trailing days. */
export function monthGrid(year: number, month: number): Array<Array<number | null>> {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = firstOfMonth.getDay(); // 0=Sun
  const cells: Array<number | null> = Array.from({ length: leading }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: Array<Array<number | null>> = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export function isoDateFor(year: number, month: number, day: number): ISODate {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function groupLessonsByDate(
  lessons: Lesson[],
): Map<ISODate, Lesson[]> {
  const m = new Map<ISODate, Lesson[]>();
  for (const l of lessons) {
    if (!l.date) continue;
    if (!m.has(l.date)) m.set(l.date, []);
    m.get(l.date)!.push(l);
  }
  return m;
}

/**
 * Densest ISO-week bucket among dated lessons.
 * Returns { week: 1..53, count: N } or null if no dated lessons.
 */
export function densestWeek(
  lessons: Lesson[],
): { week: number; count: number } | null {
  const counts = new Map<number, number>();
  for (const l of lessons) {
    if (!l.date) continue;
    const w = isoWeek(l.date);
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  let maxWeek = 0;
  let maxCount = 0;
  for (const [w, c] of counts) {
    if (c > maxCount) {
      maxWeek = w;
      maxCount = c;
    }
  }
  return { week: maxWeek, count: maxCount };
}

/**
 * Find lessons whose month+day match today's month+day (year-agnostic,
 * so a lesson dated 2023-02-14 resurfaces every Feb 14 in a 2023 note).
 */
export function onThisDayLessons(
  lessons: Lesson[],
  today: Date = new Date(),
): Lesson[] {
  const mm = today.getMonth();
  const dd = today.getDate();
  return lessons.filter((l) => {
    if (!l.date) return false;
    const d = parseLocalDate(l.date);
    return d.getMonth() === mm && d.getDate() === dd;
  });
}
