import { describe, it, expect } from 'vitest';
import {
  createEmptyYear,
  createSampleYear,
  createNewLesson,
  createNewSource,
  createNewReference,
  createNewTheme,
  migrateLegacy,
} from './data';

describe('data factories', () => {
  it('createEmptyYear yields a valid skeleton', () => {
    const y = createEmptyYear(2025);
    expect(y.version).toBe(1);
    expect(y.year).toBe(2025);
    expect(y.lessons).toEqual([]);
    expect(y.sources).toEqual([]);
    expect(y.themes).toEqual([]);
    expect(y.references).toEqual([]);
    expect(y.settings.defaultView).toBe('book');
    expect(y.settings.numberFormat).toBe('YY#N');
    expect(y.createdAt).toBeTruthy();
    expect(y.updatedAt).toBeTruthy();
  });

  it('createSampleYear seeds canonical sample lessons', () => {
    const y = createSampleYear(2023);
    expect(y.year).toBe(2023);
    expect(y.theme).toBe('CODE');
    expect(y.lessons).toHaveLength(5);
    expect(y.lessons.map((l) => l.number)).toEqual([
      '23#1',
      '23#2',
      '23#3',
      '23#4',
      '23#5',
    ]);
    // Three lessons marked important per spec §6.
    expect(y.lessons.filter((l) => l.important)).toHaveLength(3);
  });

  it('createNewLesson generates unique ids and correct defaults', () => {
    const a = createNewLesson('23#10');
    const b = createNewLesson('23#11');
    expect(a.id).not.toBe(b.id);
    expect(a.number).toBe('23#10');
    expect(a.important).toBe(false);
    expect(a.visibility).toBe('private');
    expect(a.sourceIds).toEqual([]);
  });

  it('createNewSource applies overrides', () => {
    const s = createNewSource('Seneca', {
      lifeYears: '4 BCE – 65 CE',
      role: 'Stoic',
    });
    expect(s.name).toBe('Seneca');
    expect(s.kind).toBe('person');
    expect(s.lifeYears).toBe('4 BCE – 65 CE');
    expect(s.role).toBe('Stoic');
  });

  it('createNewReference defaults to book', () => {
    const r = createNewReference('Letters from a Stoic');
    expect(r.kind).toBe('book');
    expect(r.title).toBe('Letters from a Stoic');
  });

  it('createNewTheme has default color', () => {
    const t = createNewTheme('virtue');
    expect(t.name).toBe('virtue');
    expect(t.color).toBeTruthy();
  });

  it('migrateLegacy preserves raw content', () => {
    const raw = 'not in our format at all';
    const y = migrateLegacy(raw);
    expect(y.rawFallback).toBe(raw);
  });
});
