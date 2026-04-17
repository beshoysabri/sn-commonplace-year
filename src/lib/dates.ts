import type { ISODate } from '../types/commonplace';

export const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const WEEKDAYS_SHORT = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;

/**
 * Parse an ISO date ("2023-02-14") as a local-date to avoid timezone shifts.
 * We never want "Feb 13" shown in a Chicago browser for "2023-02-14".
 */
export function parseLocalDate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatDatePillText(iso: ISODate, withWeekday: boolean): string {
  const d = parseLocalDate(iso);
  const month = MONTHS_SHORT[d.getMonth()] ?? '';
  const day = d.getDate();
  const base = `${month} ${day}`;
  if (!withWeekday) return base;
  const weekday = WEEKDAYS_SHORT[d.getDay()] ?? '';
  return `${base} · ${weekday}`;
}

/** Zero-based month, day of week (0=Sun), and day-of-month for an ISO date. */
export function dateParts(iso: ISODate): { year: number; month: number; day: number; weekday: number } {
  const d = parseLocalDate(iso);
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
    weekday: d.getDay(),
  };
}

/** Today's ISO date (local). */
export function todayIso(): ISODate {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** ISO week number (1-53) per ISO 8601. */
export function isoWeek(iso: ISODate): number {
  const d = parseLocalDate(iso);
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}
