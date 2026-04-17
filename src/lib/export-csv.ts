import type { CommonplaceYear } from '../types/commonplace';

function escapeCell(v: string | number | boolean | undefined | null): string {
  if (v === undefined || v === null) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface CsvExportOptions {
  scope: 'all' | 'important';
}

export function exportCsv(
  data: CommonplaceYear,
  options: CsvExportOptions = { scope: 'all' },
) {
  const sourceById = new Map(data.sources.map((s) => [s.id, s]));
  const themeById = new Map(data.themes.map((t) => [t.id, t]));
  const refById = new Map(data.references.map((r) => [r.id, r]));
  const numberById = new Map(data.lessons.map((l) => [l.id, l.number]));

  const headers = [
    'number',
    'title',
    'date',
    'important',
    'sources',
    'themes',
    'reference',
    'original',
    'originalLanguage',
    'body',
    'reflection',
    'linkedLessons',
    'visibility',
    'createdAt',
  ];
  const lines = [headers.join(',')];
  const lessons =
    options.scope === 'important'
      ? data.lessons.filter((l) => l.important)
      : data.lessons;
  for (const l of lessons) {
    const sources = l.sourceIds
      .map((id) => sourceById.get(id)?.name)
      .filter((n): n is string => !!n)
      .join(' / ');
    const themes = l.themeIds
      .map((id) => themeById.get(id)?.name)
      .filter((n): n is string => !!n)
      .join(', ');
    const refTitle = l.referenceIds
      .map((id) => refById.get(id)?.title)
      .filter((t): t is string => !!t)
      .join(' / ');
    const linked = l.linkedLessonIds
      .map((id) => numberById.get(id))
      .filter((n): n is string => !!n)
      .join(', ');
    lines.push(
      [
        l.number,
        l.title ?? '',
        l.date ?? '',
        l.important ? 'yes' : 'no',
        sources,
        themes,
        refTitle,
        l.originalText ?? '',
        l.originalLanguage ?? '',
        l.body,
        l.reflection ?? '',
        linked,
        l.visibility,
        l.createdAt,
      ]
        .map(escapeCell)
        .join(','),
    );
  }
  const suffix = options.scope === 'important' ? '-important' : '';
  downloadCsv(lines.join('\n'), `commonplace-${data.year}${suffix}.csv`);
}
