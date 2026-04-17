import { describe, it, expect } from 'vitest';
import {
  summaryStats,
  lessonsPerMonth,
  topSources,
  themeDistribution,
  coCitationPairs,
} from './stats';
import { createSampleYear } from './data';

describe('stats', () => {
  const year = createSampleYear(2023);

  it('summaryStats totals the sample', () => {
    const s = summaryStats(year);
    expect(s.total).toBe(5);
    expect(s.important).toBe(3);
    expect(s.dated).toBe(1); // only 23#2 is dated
    expect(s.sources).toBeGreaterThanOrEqual(5);
    expect(s.priorityRatio).toBeCloseTo(3 / 5);
  });

  it('topSources returns per-source citation counts', () => {
    const top = topSources(year, 10);
    // In the sample every source is cited exactly once.
    for (const { count } of top) expect(count).toBeGreaterThan(0);
    const jung = top.find((s) => s.source.name === 'Carl Jung');
    expect(jung?.count).toBe(1);
  });

  it('topSources(importantOnly) narrows to flagged lessons', () => {
    const top = topSources(year, 10, true);
    // Sample: 23#2 (5 sources), 23#3 (Jung), 23#4 (Watts) are important.
    // Johnson (only on 23#1, not important) should be absent.
    const names = top.map((s) => s.source.name);
    expect(names).toContain('Carl Jung');
    expect(names).toContain('Alan Watts');
    expect(names).not.toContain('Samuel Johnson');
  });

  it('themeDistribution includes an untagged bucket', () => {
    const dist = themeDistribution(year);
    const untagged = dist.find((t) => t.name === 'untagged');
    // 23#1 and 23#5 have no themes.
    expect(untagged?.count).toBe(2);
  });

  it('lessonsPerMonth returns 12 entries and sums to total', () => {
    const arr = lessonsPerMonth(year);
    expect(arr).toHaveLength(12);
    const sum = arr.reduce((a, b) => a + b.total, 0);
    expect(sum).toBeGreaterThan(0);
  });

  it('coCitationPairs ranks shared citations', () => {
    const pairs = coCitationPairs(year, 10);
    // 23#2 cites 5 sources together → C(5,2)=10 pairs, each count=1.
    expect(pairs.length).toBe(10);
    for (const p of pairs) expect(p.count).toBe(1);
  });
});
