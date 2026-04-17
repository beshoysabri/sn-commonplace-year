import { describe, it, expect } from 'vitest';
import { parseBulletImport } from './import';

const SAMPLE = `2024|CODE

- 24#01
\t- "The difficulty in the spiritual path is always what comes from ourselves."
\t  — Hazrat Inayat Khan
- 24#03
\t- Those who seek knowledge, collect something every day.
\t  Those who seek the Way, let go of something every day.
\t  — Lao Tzu
- 24#05
\t- Speak to people in a way that if they died the next day, you'd be satisfied with the last thing you said to them.
- 24#21
\t- "道恆無為而無不為" Nature always does nothing (does not hurry),
\t  yet nothing it does not accomplish. /
\t  No one seems to know How useful it is to be useless. /
\t  The wise man, then, when he must govern, knows how to do nothing. /
\t  That which acts on all and meddles in none-is heaven.
\t  —Lao Tzu / Thomas Merton / Thomas Merton / Thomas Merton
- 24#23
\t- "Judge not, that ye be not judged."/"The most dangerous psychological mistake is the projection of the shadow onto others."
\t  —Mathew 7:1-5/Carl Jung
- 24#33
\t- "Quod fieri non potest, patiendum est"  What Can't Be (Done) Cured Must Be Endured. /
\t  "Remove the judgment, and you have removed the thought 'I am hurt'."
\t- —Latin/English Proverb / Marcus Aurelius
`;

describe('parseBulletImport — header', () => {
  it('reads YEAR|THEME', () => {
    const r = parseBulletImport('2024|CODE\n\n- 24#01\n\t- Body\n');
    expect(r.year).toBe(2024);
    expect(r.theme).toBe('CODE');
  });

  it('handles a year-only header', () => {
    const r = parseBulletImport('2025\n\n- 25#01\n\t- Body\n');
    expect(r.year).toBe(2025);
    expect(r.theme).toBeUndefined();
  });

  it('handles missing header gracefully', () => {
    const r = parseBulletImport('- 24#01\n\t- Body\n');
    expect(r.year).toBeUndefined();
    expect(r.lessons).toHaveLength(1);
  });
});

describe('parseBulletImport — single-quote lessons', () => {
  it('extracts attribution and body', () => {
    const r = parseBulletImport(SAMPLE);
    const l1 = r.lessons.find((l) => l.number === '24#01')!;
    expect(l1.body).toContain('spiritual path');
    expect(l1.sourceNames).toEqual(['Hazrat Inayat Khan']);
    expect(l1.bodyAttributionNames).toBeUndefined();
  });

  it('preserves multi-line bodies', () => {
    const r = parseBulletImport(SAMPLE);
    const l3 = r.lessons.find((l) => l.number === '24#03')!;
    expect(l3.body).toContain('seek knowledge');
    expect(l3.body).toContain('seek the Way');
    expect(l3.sourceNames).toEqual(['Lao Tzu']);
  });

  it('handles lessons with no attribution', () => {
    const r = parseBulletImport(SAMPLE);
    const l5 = r.lessons.find((l) => l.number === '24#05')!;
    expect(l5.sourceNames).toEqual([]);
    expect(l5.body).toContain('Speak to people');
  });
});

describe('parseBulletImport — synthesis (multi-fragment)', () => {
  it('matches per-fragment attribution when counts equal (24#21: 4 fragments × 4 sources)', () => {
    const r = parseBulletImport(SAMPLE);
    const l21 = r.lessons.find((l) => l.number === '24#21')!;
    expect(l21.bodyAttributionNames).toBeDefined();
    expect(l21.bodyAttributionNames).toHaveLength(4);
    expect(l21.bodyAttributionNames).toEqual([
      ['Lao Tzu'],
      ['Thomas Merton'],
      ['Thomas Merton'],
      ['Thomas Merton'],
    ]);
    // Lesson-level union dedupes Thomas Merton.
    expect(l21.sourceNames).toEqual(['Lao Tzu', 'Thomas Merton']);
  });

  it('handles `"/"` (no whitespace) synthesis separator (24#23)', () => {
    const r = parseBulletImport(SAMPLE);
    const l23 = r.lessons.find((l) => l.number === '24#23')!;
    expect(l23.bodyAttributionNames).toBeDefined();
    expect(l23.bodyAttributionNames).toHaveLength(2);
    expect(l23.bodyAttributionNames).toEqual([
      ['Mathew 7:1-5'],
      ['Carl Jung'],
    ]);
  });

  it('handles multi-bullet lessons where attribution is on its own bullet (24#33)', () => {
    const r = parseBulletImport(SAMPLE);
    const l33 = r.lessons.find((l) => l.number === '24#33')!;
    expect(l33.body).toContain('Quod fieri');
    expect(l33.body).toContain('Remove the judgment');
    expect(l33.bodyAttributionNames).toEqual([
      ['Latin/English Proverb'],
      ['Marcus Aurelius'],
    ]);
  });
});

describe('parseBulletImport — full sample', () => {
  it('finds all lessons and their numbers', () => {
    const r = parseBulletImport(SAMPLE);
    expect(r.lessons.map((l) => l.number)).toEqual([
      '24#01',
      '24#03',
      '24#05',
      '24#21',
      '24#23',
      '24#33',
    ]);
  });

  it('does not produce a "fragments mismatch" warning for clean samples', () => {
    const r = parseBulletImport(SAMPLE);
    expect(r.warnings).toEqual([]);
  });

  it('warns when fragment count and source count both > 1 but disagree', () => {
    const odd = `- 24#1\n\t- A / B / C\n\t  — One Author\n`;
    const r = parseBulletImport(odd);
    // 3 fragments, 1 source → no warning (fall through to lesson-level).
    expect(r.warnings).toEqual([]);
    const odd2 = `- 24#1\n\t- A / B / C\n\t  — One / Two\n`;
    const r2 = parseBulletImport(odd2);
    // 3 fragments, 2 sources → warn.
    expect(r2.warnings.length).toBe(1);
    expect(r2.warnings[0]).toContain('24#1');
  });
});

describe('parseBulletImport — separator variants', () => {
  it('accepts backslash as a source separator (24#32-style)', () => {
    const text = `- 24#32\n\t- Body text /\n\t  Second fragment\n\t  — Author A \\ Author B\n`;
    const r = parseBulletImport(text);
    const l = r.lessons[0];
    expect(l.bodyAttributionNames).toEqual([['Author A'], ['Author B']]);
  });

  it('accepts em-dash, horizontal-bar, and double-hyphen attribution prefixes', () => {
    const variants = ['—', '―', '--'];
    for (const dash of variants) {
      const r = parseBulletImport(`- 24#1\n\t- Quote\n\t  ${dash} Author\n`);
      expect(r.lessons[0].sourceNames).toEqual(['Author']);
    }
  });
});
