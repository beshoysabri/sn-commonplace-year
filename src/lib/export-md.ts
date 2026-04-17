import type { CommonplaceYear, Lesson } from '../types/commonplace';
import { serializeMarkdown } from './markdown';
import { splitSynthesis } from './fragments';

function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface MarkdownExportOptions {
  scope: 'all' | 'important';
  /** 'canonical' round-trips the @commonplace format; 'readable' is bloggable. */
  variant: 'canonical' | 'readable';
}

export function exportMarkdown(
  data: CommonplaceYear,
  options: MarkdownExportOptions = { scope: 'all', variant: 'canonical' },
) {
  const scoped = scopedData(data, options.scope);
  const text =
    options.variant === 'canonical'
      ? serializeMarkdown(scoped)
      : toReadableMarkdown(scoped);
  const suffix = options.scope === 'important' ? '-important' : '';
  const ext = options.variant === 'readable' ? 'md' : 'md';
  downloadText(
    text,
    `commonplace-${data.year}${suffix}.${ext}`,
    'text/markdown',
  );
}

function scopedData(
  data: CommonplaceYear,
  scope: 'all' | 'important',
): CommonplaceYear {
  if (scope === 'all') return data;
  return { ...data, lessons: data.lessons.filter((l) => l.important) };
}

function toReadableMarkdown(data: CommonplaceYear): string {
  const out: string[] = [];
  out.push(`# The Commonplace Book of ${data.year}${data.theme ? ` — ${data.theme}` : ''}`);
  out.push('');
  if (data.summary) {
    out.push(data.summary.trim());
    out.push('');
  }
  const sourceById = new Map(data.sources.map((s) => [s.id, s]));
  const themeById = new Map(data.themes.map((t) => [t.id, t]));
  const refById = new Map(data.references.map((r) => [r.id, r]));

  for (const l of data.lessons) {
    out.push(`## ${l.number}${l.title ? ' · ' + l.title : ''}`);
    if (l.date) out.push(`_${l.date}_`);
    if (l.originalText) {
      out.push('');
      out.push(`> *${l.originalText}*`);
      if (l.originalLanguage) {
        out.push(`> — ${l.originalLanguage}`);
      }
    }
    out.push('');
    const fragments = splitSynthesis(l.body);
    for (let i = 0; i < fragments.length; i++) {
      const frag = fragments[i];
      const fragIds = l.bodyAttributions?.[i] ?? [];
      const fragNames = fragIds
        .map((id) => sourceById.get(id)?.name)
        .filter((n): n is string => !!n);
      if (fragNames.length > 0) {
        out.push(`> ${frag} — *${fragNames.join(', ')}*`);
      } else {
        out.push(`> ${frag}`);
      }
      if (i < fragments.length - 1) out.push('>');
    }
    if (
      l.sourceIds.length > 0 &&
      !hasPerFragmentAttribution(l)
    ) {
      const names = l.sourceIds
        .map((id) => sourceById.get(id)?.name)
        .filter((n): n is string => !!n);
      out.push('');
      out.push(`— *${names.join(' / ')}*`);
    }
    const themeNames = l.themeIds
      .map((id) => themeById.get(id)?.name)
      .filter((n): n is string => !!n);
    if (themeNames.length > 0) {
      out.push('');
      out.push(`Themes: ${themeNames.map((n) => `_${n}_`).join(', ')}`);
    }
    if (l.referenceIds.length > 0) {
      const citations = l.referenceIds
        .map((id) => refById.get(id))
        .filter((r): r is NonNullable<typeof r> => !!r)
        .map((r) => `_${r.title}_${r.author ? `, ${r.author}` : ''}`);
      if (citations.length > 0) {
        out.push(`From: ${citations.join(' · ')}`);
      }
    }
    if (l.reflection) {
      out.push('');
      out.push(`**Reflection:** ${l.reflection}`);
    }
    out.push('');
    out.push('---');
    out.push('');
  }
  return out.join('\n');
}

function hasPerFragmentAttribution(l: Lesson): boolean {
  return (
    !!l.bodyAttributions &&
    l.bodyAttributions.some((ids) => ids.length > 0)
  );
}
