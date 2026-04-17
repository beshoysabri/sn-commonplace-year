import { describe, it, expect } from 'vitest';
import { filterLessons, searchAll } from './search';
import { createSampleYear } from './data';

describe('search.filterLessons', () => {
  const year = createSampleYear(2023);

  it('empty query returns all lessons', () => {
    expect(filterLessons(year.lessons, year, '').length).toBe(year.lessons.length);
  });

  it('matches by body substring', () => {
    const hits = filterLessons(year.lessons, year, 'beast of himself');
    expect(hits).toHaveLength(1);
    expect(hits[0].number).toBe('23#1');
  });

  it('matches by lesson number', () => {
    const hits = filterLessons(year.lessons, year, '23#3');
    expect(hits).toHaveLength(1);
    expect(hits[0].number).toBe('23#3');
  });

  it('matches by source name', () => {
    const hits = filterLessons(year.lessons, year, 'jung');
    expect(hits.map((l) => l.number)).toEqual(['23#3']);
  });

  it('matches by original text', () => {
    const hits = filterLessons(year.lessons, year, 'aut viam');
    expect(hits).toHaveLength(1);
    expect(hits[0].number).toBe('23#2');
  });

  it('matches by reference title', () => {
    const hits = filterLessons(year.lessons, year, 'road less');
    expect(hits.map((l) => l.number)).toEqual(['23#3']);
  });

  it('matches by reflection', () => {
    const hits = filterLessons(year.lessons, year, 'path is a verb');
    expect(hits).toHaveLength(1);
    expect(hits[0].number).toBe('23#2');
  });

  it('is case insensitive', () => {
    const upper = filterLessons(year.lessons, year, 'JUNG');
    const lower = filterLessons(year.lessons, year, 'jung');
    expect(upper.map((l) => l.id)).toEqual(lower.map((l) => l.id));
  });
});

describe('search.searchAll', () => {
  const year = createSampleYear(2023);

  it('returns matching sources + lessons for a shared term', () => {
    const r = searchAll(year, 'jung');
    expect(r.lessons.length).toBe(1);
    expect(r.sources.some((s) => s.name === 'Carl Jung')).toBe(true);
  });

  it('performs in < 100ms for 500 lessons', () => {
    const big = createSampleYear(2023);
    // duplicate to reach 500
    const padded = [...big.lessons];
    while (padded.length < 500) {
      const copy = { ...big.lessons[padded.length % big.lessons.length] };
      copy.id = `${copy.id}-${padded.length}`;
      copy.number = `23#${padded.length + 100}`;
      padded.push(copy);
    }
    big.lessons = padded;
    const t = performance.now();
    filterLessons(big.lessons, big, 'path');
    const elapsed = performance.now() - t;
    expect(elapsed).toBeLessThan(100);
  });
});
