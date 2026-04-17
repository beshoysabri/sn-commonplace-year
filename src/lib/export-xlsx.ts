import { utils, writeFile } from 'xlsx';
import type { CommonplaceYear } from '../types/commonplace';

export interface XlsxExportOptions {
  scope: 'all' | 'important';
}

export function exportXlsx(
  data: CommonplaceYear,
  options: XlsxExportOptions = { scope: 'all' },
) {
  const sourceById = new Map(data.sources.map((s) => [s.id, s]));
  const themeById = new Map(data.themes.map((t) => [t.id, t]));
  const refById = new Map(data.references.map((r) => [r.id, r]));
  const numberById = new Map(data.lessons.map((l) => [l.id, l.number]));
  const lessons =
    options.scope === 'important'
      ? data.lessons.filter((l) => l.important)
      : data.lessons;

  const wb = utils.book_new();

  // Sheet 1: Cover
  const totalLessons = data.lessons.length;
  const importantCount = data.lessons.filter((l) => l.important).length;
  const cover = [
    ['Commonplace Year', data.year],
    ['Theme', data.theme ?? ''],
    ['Summary', data.summary ?? ''],
    ['Total lessons', totalLessons],
    ['Important', importantCount],
    ['Sources', data.sources.length],
    ['References', data.references.length],
    ['Themes', data.themes.length],
    ['Scope (this export)', options.scope],
    ['Exported at', new Date().toISOString()],
  ];
  const coverSheet = utils.aoa_to_sheet(cover);
  utils.book_append_sheet(wb, coverSheet, 'Cover');

  // Sheet 2: Lessons
  const lessonRows = lessons.map((l) => ({
    Number: l.number,
    Title: l.title ?? '',
    Date: l.date ?? '',
    Important: l.important ? 'yes' : 'no',
    Sources: l.sourceIds
      .map((id) => sourceById.get(id)?.name)
      .filter((n): n is string => !!n)
      .join(' / '),
    Themes: l.themeIds
      .map((id) => themeById.get(id)?.name)
      .filter((n): n is string => !!n)
      .join(', '),
    Reference: l.referenceIds
      .map((id) => refById.get(id)?.title)
      .filter((t): t is string => !!t)
      .join(' / '),
    Original: l.originalText ?? '',
    Language: l.originalLanguage ?? '',
    Body: l.body,
    Reflection: l.reflection ?? '',
    LinkedLessons: l.linkedLessonIds
      .map((id) => numberById.get(id))
      .filter((n): n is string => !!n)
      .join(', '),
    Visibility: l.visibility,
    CreatedAt: l.createdAt,
    UpdatedAt: l.updatedAt,
  }));
  utils.book_append_sheet(wb, utils.json_to_sheet(lessonRows), 'Lessons');

  // Sheet 3: Sources (with citation counts)
  const citationCount = new Map<string, number>();
  for (const l of data.lessons) {
    for (const id of l.sourceIds) {
      citationCount.set(id, (citationCount.get(id) ?? 0) + 1);
    }
  }
  const sourceRows = data.sources.map((s) => ({
    Name: s.name,
    Kind: s.kind,
    LifeYears: s.lifeYears ?? '',
    Role: s.role ?? '',
    Reverence: s.reverence ?? '',
    Color: s.color,
    Citations: citationCount.get(s.id) ?? 0,
    Notes: s.notes ?? '',
  }));
  utils.book_append_sheet(wb, utils.json_to_sheet(sourceRows), 'Sources');

  // Sheet 4: References
  const refCount = new Map<string, number>();
  for (const l of data.lessons) {
    for (const id of l.referenceIds) {
      refCount.set(id, (refCount.get(id) ?? 0) + 1);
    }
  }
  const refRows = data.references.map((r) => ({
    Title: r.title,
    Author: r.author ?? '',
    Kind: r.kind,
    Year: r.year ?? '',
    Status: r.status ?? '',
    Rating: r.rating ?? '',
    URL: r.url ?? '',
    Citations: refCount.get(r.id) ?? 0,
    Notes: r.notes ?? '',
  }));
  utils.book_append_sheet(wb, utils.json_to_sheet(refRows), 'References');

  // Sheet 5: Themes
  const themeCount = new Map<string, number>();
  for (const l of data.lessons) {
    for (const id of l.themeIds) {
      themeCount.set(id, (themeCount.get(id) ?? 0) + 1);
    }
  }
  const themeRows = data.themes.map((t) => ({
    Name: t.name,
    Color: t.color,
    Description: t.description ?? '',
    Citations: themeCount.get(t.id) ?? 0,
  }));
  utils.book_append_sheet(wb, utils.json_to_sheet(themeRows), 'Themes');

  const suffix = options.scope === 'important' ? '-important' : '';
  writeFile(wb, `commonplace-${data.year}${suffix}.xlsx`);
}
