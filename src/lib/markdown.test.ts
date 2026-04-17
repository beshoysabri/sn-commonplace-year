import { describe, it, expect } from 'vitest';
import { parseMarkdown, serializeMarkdown, legacyFallback } from './markdown';
import { createEmptyYear, createSampleYear } from './data';
import type { CommonplaceYear, Lesson } from '../types/commonplace';

// =============================================================
// Helpers
// =============================================================

/**
 * Strip unstable fields (UUIDs, timestamps) so two CommonplaceYear
 * objects can be compared structurally after a round trip through
 * markdown (which regenerates IDs).
 */
interface NormalizedLesson {
  number: string;
  title?: string;
  body: string;
  originalText?: string;
  originalLanguage?: string;
  date?: string;
  important: boolean;
  reflection?: string;
  visibility: string;
  sourceNames: string[];
  themeNames: string[];
  linkedLessonNumbers: string[];
  referenceTitle?: string;
  bodyAttributionNames?: string[][];
}

function normalize(y: CommonplaceYear) {
  const sourceById = new Map(y.sources.map((s) => [s.id, s]));
  const themeById = new Map(y.themes.map((t) => [t.id, t]));
  const refById = new Map(y.references.map((r) => [r.id, r]));
  const lessonNumberById = new Map(y.lessons.map((l) => [l.id, l.number]));

  const lessons: NormalizedLesson[] = y.lessons.map((l) => {
    const n: NormalizedLesson = {
      number: l.number,
      body: l.body,
      important: l.important,
      visibility: l.visibility,
      sourceNames: l.sourceIds
        .map((id) => sourceById.get(id)?.name)
        .filter((x): x is string => !!x),
      themeNames: l.themeIds
        .map((id) => themeById.get(id)?.name)
        .filter((x): x is string => !!x),
      linkedLessonNumbers: l.linkedLessonIds
        .map((id) => lessonNumberById.get(id))
        .filter((x): x is string => !!x),
    };
    if (l.title) n.title = l.title;
    if (l.originalText) n.originalText = l.originalText;
    if (l.originalLanguage) n.originalLanguage = l.originalLanguage;
    if (l.date) n.date = l.date;
    if (l.reflection) n.reflection = l.reflection;
    if (l.referenceId) {
      const t = refById.get(l.referenceId)?.title;
      if (t) n.referenceTitle = t;
    }
    if (l.bodyAttributions) {
      n.bodyAttributionNames = l.bodyAttributions.map((ids) =>
        ids
          .map((id) => sourceById.get(id)?.name)
          .filter((x): x is string => !!x),
      );
    }
    return n;
  });

  return {
    version: y.version,
    year: y.year,
    theme: y.theme,
    summary: y.summary,
    settings: y.settings,
    lessons,
    sources: y.sources
      .map((s) => ({
        name: s.name,
        kind: s.kind,
        lifeYears: s.lifeYears,
        role: s.role,
        color: s.color,
        notes: s.notes,
        avatarUrl: s.avatarUrl,
        reverence: s.reverence,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    references: y.references
      .map((r) => ({
        title: r.title,
        author: r.author,
        kind: r.kind,
        year: r.year,
        url: r.url,
        coverUrl: r.coverUrl,
        status: r.status,
        rating: r.rating,
        notes: r.notes,
      }))
      .sort((a, b) => a.title.localeCompare(b.title)),
    themes: y.themes
      .map((t) => ({
        name: t.name,
        color: t.color,
        description: t.description,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

// =============================================================
// Round-trip
// =============================================================

describe('markdown round-trip', () => {
  it('sample year serializes and reparses to structurally-equal data', () => {
    const original = createSampleYear(2023);
    const md = serializeMarkdown(original);
    const reparsed = parseMarkdown(md);
    expect(normalize(reparsed)).toEqual(normalize(original));
  });

  it('empty year serializes and reparses cleanly', () => {
    const original = createEmptyYear(2024);
    const md = serializeMarkdown(original);
    const reparsed = parseMarkdown(md);
    expect(normalize(reparsed)).toEqual(normalize(original));
  });

  it('round-trip preserves all 5 attributions on lesson 23#2', () => {
    const original = createSampleYear(2023);
    const md = serializeMarkdown(original);
    const reparsed = parseMarkdown(md);
    const l2 = reparsed.lessons.find((l) => l.number === '23#2');
    expect(l2).toBeDefined();
    expect(l2!.sourceIds).toHaveLength(5);
    const names = l2!.sourceIds
      .map((id) => reparsed.sources.find((s) => s.id === id)!.name)
      .sort();
    expect(names).toEqual([
      'Hannibal',
      'Helena Petrovna Blavatsky',
      'Kabir',
      'Rumi',
      'Søren Kierkegaard',
    ]);
  });

  it('round-trip preserves multi-line body with " / " synthesis separators', () => {
    const original = createSampleYear(2023);
    const md = serializeMarkdown(original);
    const reparsed = parseMarkdown(md);
    const l2 = reparsed.lessons.find((l) => l.number === '23#2')!;
    expect(l2.body.split('\n').length).toBe(5);
    expect(l2.body).toContain('/');
  });

  it('round-trip preserves original-language text and language', () => {
    const original = createSampleYear(2023);
    const md = serializeMarkdown(original);
    const reparsed = parseMarkdown(md);
    const l2 = reparsed.lessons.find((l) => l.number === '23#2')!;
    expect(l2.originalText).toBe('AUT VIAM INVENIAM AUT FACIAM');
    expect(l2.originalLanguage).toBe('latin');
  });

  it('round-trip preserves priority flags', () => {
    const original = createSampleYear(2023);
    const md = serializeMarkdown(original);
    const reparsed = parseMarkdown(md);
    const importantNumbers = reparsed.lessons
      .filter((l) => l.important)
      .map((l) => l.number)
      .sort();
    expect(importantNumbers).toEqual(['23#2', '23#3', '23#4']);
  });

  it('round-trip preserves lesson reference link', () => {
    const original = createSampleYear(2023);
    const md = serializeMarkdown(original);
    const reparsed = parseMarkdown(md);
    const l3 = reparsed.lessons.find((l) => l.number === '23#3')!;
    expect(l3.referenceId).toBeDefined();
    const ref = reparsed.references.find((r) => r.id === l3.referenceId)!;
    expect(ref.title).toBe('The Road Less Traveled');
    expect(ref.author).toBe('M. Scott Peck');
    expect(ref.status).toBe('read');
    expect(ref.rating).toBe(4);
  });

  it('round-trip preserves theme-of-the-year and summary', () => {
    const original = createSampleYear(2023);
    const md = serializeMarkdown(original);
    const reparsed = parseMarkdown(md);
    expect(reparsed.theme).toBe('CODE');
    expect(reparsed.summary).toMatch(/path reveals itself/);
  });

  it('round-trip preserves per-fragment body attributions', () => {
    const original = createSampleYear(2023);
    const md = serializeMarkdown(original);
    expect(md).toContain('@bodySources:');
    const reparsed = parseMarkdown(md);
    const l2 = reparsed.lessons.find((l) => l.number === '23#2')!;
    expect(l2.bodyAttributions).toBeDefined();
    expect(l2.bodyAttributions).toHaveLength(5);
    // Each fragment has exactly one source in the sample.
    for (const ids of l2.bodyAttributions!) {
      expect(ids).toHaveLength(1);
    }
    // First fragment attributes to Hannibal.
    const firstSource = reparsed.sources.find(
      (s) => s.id === l2.bodyAttributions![0][0],
    );
    expect(firstSource?.name).toBe('Hannibal');
    // Fifth attributes to Blavatsky.
    const lastSource = reparsed.sources.find(
      (s) => s.id === l2.bodyAttributions![4][0],
    );
    expect(lastSource?.name).toBe('Helena Petrovna Blavatsky');
  });

  it('round-trip preserves dates on dated lessons', () => {
    const original = createSampleYear(2023);
    const md = serializeMarkdown(original);
    const reparsed = parseMarkdown(md);
    const l2 = reparsed.lessons.find((l) => l.number === '23#2')!;
    expect(l2.date).toBe('2023-02-14');
  });
});

// =============================================================
// Permissive parsing
// =============================================================

describe('markdown permissive parsing', () => {
  it('creates sources on the fly when a lesson cites an unknown name', () => {
    const raw = [
      '@commonplace: year',
      '@version: 1',
      '@year: 2024',
      '@numberFormat: YY#N',
      '@defaultView: book',
      '@paperMode: no',
      '@showNumbersInBookView: yes',
      '@autoNumber: yes',
      '',
      '---',
      '',
      '---',
      '',
      '---',
      '',
      '---',
      '',
      '@lesson: 24#1',
      '  @important: no',
      '  @sources: A Completely Unknown Person',
      '  @themes:',
      '  @visibility: private',
      '  @body:',
      '    Quote goes here.',
      '',
    ].join('\n');
    const parsed = parseMarkdown(raw);
    expect(parsed.sources).toHaveLength(1);
    expect(parsed.sources[0].name).toBe('A Completely Unknown Person');
    expect(parsed.lessons[0].sourceIds[0]).toBe(parsed.sources[0].id);
  });

  it('creates themes on the fly when a lesson uses an unknown theme', () => {
    const raw = [
      '@commonplace: year',
      '@version: 1',
      '@year: 2024',
      '@numberFormat: YY#N',
      '@defaultView: book',
      '@paperMode: no',
      '@showNumbersInBookView: yes',
      '@autoNumber: yes',
      '',
      '---',
      '',
      '---',
      '',
      '---',
      '',
      '---',
      '',
      '@lesson: 24#1',
      '  @important: no',
      '  @sources:',
      '  @themes: brand-new-theme, another',
      '  @visibility: private',
      '  @body:',
      '    Quote.',
    ].join('\n');
    const parsed = parseMarkdown(raw);
    expect(parsed.themes.map((t) => t.name).sort()).toEqual([
      'another',
      'brand-new-theme',
    ]);
  });
});

// =============================================================
// Legacy fallback
// =============================================================

describe('legacy fallback', () => {
  it('non-@commonplace input preserves raw text in rawFallback', () => {
    const raw = "# My old notes\n\n- 23#1: some quote\n- 23#2: another";
    const parsed = parseMarkdown(raw);
    expect(parsed.rawFallback).toBe(raw);
    expect(parsed.lessons).toEqual([]);
  });

  it('migrateLegacy via legacyFallback returns a valid empty-but-recoverable year', () => {
    const y = legacyFallback('anything at all');
    expect(y.version).toBe(1);
    expect(y.rawFallback).toBe('anything at all');
    expect(y.settings.defaultView).toBe('book');
  });

  it('empty string input yields legacy fallback year with rawFallback empty', () => {
    const y = parseMarkdown('');
    expect(y.rawFallback).toBe('');
    expect(y.lessons).toHaveLength(0);
  });
});

// =============================================================
// Attribute parsing
// =============================================================

describe('attribute parsing', () => {
  it('source header parses multiple attributes', () => {
    const raw = [
      '@commonplace: year',
      '@version: 1',
      '@year: 2023',
      '@numberFormat: YY#N',
      '@defaultView: book',
      '@paperMode: no',
      '@showNumbersInBookView: yes',
      '@autoNumber: yes',
      '',
      '---',
      '',
      '---',
      '',
      '@source: Marcus Aurelius [kind:person] [years:121–180] [role:Stoic emperor] [color:#7C3AED]',
      '',
      '---',
      '',
      '---',
      '',
    ].join('\n');
    const parsed = parseMarkdown(raw);
    expect(parsed.sources).toHaveLength(1);
    const s = parsed.sources[0];
    expect(s.name).toBe('Marcus Aurelius');
    expect(s.kind).toBe('person');
    expect(s.lifeYears).toBe('121–180');
    expect(s.role).toBe('Stoic emperor');
    expect(s.color).toBe('#7C3AED');
  });

  it('reference header parses rating and status', () => {
    const raw = [
      '@commonplace: year',
      '@version: 1',
      '@year: 2023',
      '@numberFormat: YY#N',
      '@defaultView: book',
      '@paperMode: no',
      '@showNumbersInBookView: yes',
      '@autoNumber: yes',
      '',
      '---',
      '',
      '---',
      '',
      '---',
      '',
      '@reference: Meditations [author:Marcus Aurelius] [kind:book] [year:180] [status:read] [rating:5]',
      '',
      '---',
      '',
    ].join('\n');
    const parsed = parseMarkdown(raw);
    expect(parsed.references).toHaveLength(1);
    const r = parsed.references[0];
    expect(r.title).toBe('Meditations');
    expect(r.author).toBe('Marcus Aurelius');
    expect(r.year).toBe(180);
    expect(r.status).toBe('read');
    expect(r.rating).toBe(5);
  });
});

// =============================================================
// Bool parsing
// =============================================================

describe('bool parsing variants', () => {
  const mkMd = (important: string) =>
    [
      '@commonplace: year',
      '@version: 1',
      '@year: 2023',
      '@numberFormat: YY#N',
      '@defaultView: book',
      '@paperMode: no',
      '@showNumbersInBookView: yes',
      '@autoNumber: yes',
      '',
      '---',
      '',
      '---',
      '',
      '---',
      '',
      '---',
      '',
      '@lesson: 23#1',
      `  @important: ${important}`,
      '  @sources:',
      '  @themes:',
      '  @visibility: private',
      '  @body:',
      '    Body.',
    ].join('\n');

  const cases: Array<[string, boolean]> = [
    ['yes', true],
    ['true', true],
    ['1', true],
    ['no', false],
    ['false', false],
    ['0', false],
  ];

  for (const [input, expected] of cases) {
    it(`parses '${input}' as ${expected}`, () => {
      const parsed = parseMarkdown(mkMd(input));
      const l = parsed.lessons[0] as Lesson;
      expect(l.important).toBe(expected);
    });
  }
});

// =============================================================
// Linked lessons
// =============================================================

describe('linked lessons', () => {
  it('resolves linkedLessons by number', () => {
    const empty = createEmptyYear(2023);
    const l1: Lesson = {
      id: '00000000-0000-0000-0000-000000000001',
      number: '23#1',
      body: 'First',
      important: false,
      sourceIds: [],
      themeIds: [],
      linkedLessonIds: [],
      visibility: 'private',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    };
    const l2: Lesson = {
      id: '00000000-0000-0000-0000-000000000002',
      number: '23#2',
      body: 'Second',
      important: false,
      sourceIds: [],
      themeIds: [],
      linkedLessonIds: [l1.id],
      visibility: 'private',
      createdAt: '2023-01-02T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z',
    };
    empty.lessons = [l1, l2];
    const md = serializeMarkdown(empty);
    expect(md).toContain('@linkedLessons: 23#1');
    const reparsed = parseMarkdown(md);
    const rl2 = reparsed.lessons.find((l) => l.number === '23#2')!;
    expect(rl2.linkedLessonIds).toHaveLength(1);
    const linkedNumber = reparsed.lessons.find(
      (l) => l.id === rl2.linkedLessonIds[0],
    )!.number;
    expect(linkedNumber).toBe('23#1');
  });
});
