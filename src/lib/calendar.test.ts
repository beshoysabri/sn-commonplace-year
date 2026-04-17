import { describe, it, expect } from 'vitest';
import {
  densestWeek,
  groupLessonsByDate,
  isoDateFor,
  monthGrid,
  onThisDayLessons,
} from './calendar';
import { createSampleYear } from './data';
import type { Lesson } from '../types/commonplace';

describe('monthGrid', () => {
  it('returns 5 or 6 rows of 7 days', () => {
    const rows = monthGrid(2023, 1); // February 2023
    expect(rows.length).toBeGreaterThanOrEqual(4);
    expect(rows.length).toBeLessThanOrEqual(6);
    for (const row of rows) expect(row.length).toBe(7);
  });

  it('pads leading days with null', () => {
    const rows = monthGrid(2023, 1); // Feb 1 2023 is a Wednesday
    // Sunday, Monday, Tuesday are null; Wednesday is 1
    expect(rows[0][0]).toBeNull();
    expect(rows[0][1]).toBeNull();
    expect(rows[0][2]).toBeNull();
    expect(rows[0][3]).toBe(1);
  });

  it('contains 28 days for Feb non-leap year', () => {
    const rows = monthGrid(2023, 1);
    const flat = rows.flat().filter((x): x is number => x !== null);
    expect(flat).toHaveLength(28);
  });
});

describe('isoDateFor', () => {
  it('pads single-digit month/day with zeros', () => {
    expect(isoDateFor(2023, 0, 3)).toBe('2023-01-03');
    expect(isoDateFor(2023, 11, 31)).toBe('2023-12-31');
  });
});

describe('groupLessonsByDate', () => {
  it('skips undated lessons', () => {
    const year = createSampleYear(2023);
    const m = groupLessonsByDate(year.lessons);
    // Only 23#2 has a date in the sample.
    expect(m.size).toBe(1);
    expect(m.get('2023-02-14')).toHaveLength(1);
    expect(m.get('2023-02-14')![0].number).toBe('23#2');
  });
});

describe('onThisDayLessons', () => {
  it('matches month+day regardless of year', () => {
    const year = createSampleYear(2023);
    const today = new Date(2025, 1, 14); // Feb 14 2025
    const hits = onThisDayLessons(year.lessons, today);
    expect(hits).toHaveLength(1);
    expect(hits[0].number).toBe('23#2');
  });

  it('returns [] when nothing matches today', () => {
    const year = createSampleYear(2023);
    const today = new Date(2025, 6, 4); // Jul 4 — no match
    expect(onThisDayLessons(year.lessons, today)).toEqual([]);
  });
});

describe('densestWeek', () => {
  it('returns null for year with no dated lessons', () => {
    const year = createSampleYear(2023);
    year.lessons = year.lessons.map((l) => ({ ...l, date: undefined }));
    expect(densestWeek(year.lessons)).toBeNull();
  });

  it('finds the week with most dated lessons', () => {
    const base: Lesson = {
      id: '1',
      number: '23#1',
      body: 'x',
      important: false,
      sourceIds: [],
      themeIds: [],
      linkedLessonIds: [],
      visibility: 'private',
      createdAt: '',
      updatedAt: '',
    };
    const lessons: Lesson[] = [
      { ...base, id: '1', date: '2023-02-14' }, // ISO week 7
      { ...base, id: '2', date: '2023-02-13' }, // ISO week 7
      { ...base, id: '3', date: '2023-02-12' }, // ISO week 6 (Sun of prev week)
    ];
    const d = densestWeek(lessons);
    expect(d?.week).toBe(7);
    expect(d?.count).toBe(2);
  });
});
