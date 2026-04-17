import jsPDF from 'jspdf';
import type { CommonplaceYear, Lesson } from '../types/commonplace';
import { splitSynthesis } from './fragments';

export interface PdfExportOptions {
  scope: 'all' | 'important' | 'by-theme' | 'by-source';
  includeReflections: boolean;
  includeSummary: boolean;
  includeIndexes: boolean;
  paperSize: 'a5' | 'letter';
  /** Optional personal dedication printed on the title page. */
  dedication?: string;
}

export const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
  scope: 'all',
  includeReflections: true,
  includeSummary: true,
  includeIndexes: true,
  paperSize: 'a5',
};

// Page layout constants (in mm).
const MARGIN = { top: 18, right: 16, bottom: 20, left: 20 } as const;
const LINE = { body: 4.8, gap: 2, section: 8 } as const;
const FONT = {
  body: 10,
  title: 20,
  subtitle: 12,
  chapter: 16,
  meta: 8,
} as const;

export function exportPdf(
  data: CommonplaceYear,
  options: PdfExportOptions = DEFAULT_PDF_OPTIONS,
) {
  const scoped = scopeLessons(data, options.scope);
  const doc = new jsPDF({
    unit: 'mm',
    format: options.paperSize === 'letter' ? 'letter' : 'a5',
    orientation: 'portrait',
  });
  doc.setFont('times', 'normal');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const bodyWidth = pageWidth - MARGIN.left - MARGIN.right;

  const ctx: RenderContext = {
    doc,
    y: MARGIN.top,
    pageWidth,
    pageHeight,
    bodyWidth,
    pageNumbers: new Map(),
  };

  // --- Front matter ---
  renderTitlePage(ctx, data, options);
  if (options.includeSummary && data.summary) {
    newPage(ctx);
    renderSummary(ctx, data);
  }

  // --- Body ---
  newPage(ctx);
  for (const lesson of scoped) {
    renderLesson(ctx, lesson, data, options);
  }

  // --- Back matter ---
  if (options.includeIndexes) {
    renderIndexes(ctx, data, scoped);
  }

  const suffix = options.scope === 'important' ? '-important' : '';
  doc.save(`commonplace-${data.year}${suffix}.pdf`);
}

interface RenderContext {
  doc: jsPDF;
  y: number;
  pageWidth: number;
  pageHeight: number;
  bodyWidth: number;
  /** For index back-references: lessonId → page number. */
  pageNumbers: Map<string, number>;
}

function scopeLessons(
  data: CommonplaceYear,
  scope: PdfExportOptions['scope'],
): Lesson[] {
  switch (scope) {
    case 'all':
      return data.lessons;
    case 'important':
      return data.lessons.filter((l) => l.important);
    case 'by-theme':
      return [...data.lessons].sort((a, b) => {
        const aTheme = data.themes.find((t) => t.id === a.themeIds[0])?.name ?? '';
        const bTheme = data.themes.find((t) => t.id === b.themeIds[0])?.name ?? '';
        return aTheme.localeCompare(bTheme);
      });
    case 'by-source':
      return [...data.lessons].sort((a, b) => {
        const aSource = data.sources.find((s) => s.id === a.sourceIds[0])?.name ?? '';
        const bSource = data.sources.find((s) => s.id === b.sourceIds[0])?.name ?? '';
        return aSource.localeCompare(bSource);
      });
  }
}

function newPage(ctx: RenderContext) {
  ctx.doc.addPage();
  ctx.y = MARGIN.top;
}

function ensureRoom(ctx: RenderContext, needed: number) {
  if (ctx.y + needed > ctx.pageHeight - MARGIN.bottom) newPage(ctx);
}

function renderTitlePage(
  ctx: RenderContext,
  data: CommonplaceYear,
  options: PdfExportOptions,
) {
  const { doc, pageWidth, pageHeight } = ctx;
  doc.setFont('times', 'italic');
  doc.setFontSize(FONT.subtitle);
  doc.setTextColor(90);
  const sub = 'The Commonplace Book of';
  doc.text(sub, pageWidth / 2, pageHeight / 2 - 30, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(FONT.title + 20);
  doc.setTextColor(30);
  doc.text(String(data.year), pageWidth / 2, pageHeight / 2, { align: 'center' });

  if (data.theme) {
    doc.setFont('times', 'normal');
    doc.setFontSize(FONT.subtitle);
    doc.setTextColor(100);
    doc.text(data.theme, pageWidth / 2, pageHeight / 2 + 12, { align: 'center' });
  }

  if (options.dedication) {
    doc.setFont('times', 'italic');
    doc.setFontSize(FONT.meta + 2);
    doc.setTextColor(120);
    const dedLines = doc.splitTextToSize(
      options.dedication,
      ctx.bodyWidth * 0.7,
    );
    doc.text(dedLines, pageWidth / 2, pageHeight - 40, { align: 'center' });
  }

  doc.setFont('times', 'normal');
  doc.setTextColor(150);
  doc.setFontSize(FONT.meta);
  doc.text(
    `${data.lessons.length} lesson${data.lessons.length === 1 ? '' : 's'}`,
    pageWidth / 2,
    pageHeight - 20,
    { align: 'center' },
  );
}

function renderSummary(ctx: RenderContext, data: CommonplaceYear) {
  const { doc } = ctx;
  doc.setFont('times', 'bold');
  doc.setFontSize(FONT.chapter);
  doc.setTextColor(30);
  doc.text('Foreword', MARGIN.left, ctx.y);
  ctx.y += 10;
  doc.setFont('times', 'normal');
  doc.setFontSize(FONT.body + 1);
  doc.setTextColor(40);
  const lines = doc.splitTextToSize(data.summary ?? '', ctx.bodyWidth);
  for (const line of lines) {
    ensureRoom(ctx, LINE.body);
    doc.text(line, MARGIN.left, ctx.y);
    ctx.y += LINE.body + 1;
  }
}

function renderLesson(
  ctx: RenderContext,
  lesson: Lesson,
  data: CommonplaceYear,
  options: PdfExportOptions,
) {
  const { doc } = ctx;
  ctx.pageNumbers.set(lesson.id, doc.internal.pages.length - 1);

  // Running header / number
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT.meta);
  doc.setTextColor(130);
  doc.text(lesson.number, MARGIN.left, ctx.y);
  ctx.y += 6;

  if (lesson.title) {
    ensureRoom(ctx, 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(FONT.body + 4);
    doc.setTextColor(20);
    const titleLines = doc.splitTextToSize(lesson.title, ctx.bodyWidth);
    for (const line of titleLines) {
      ensureRoom(ctx, 6);
      doc.text(line, MARGIN.left, ctx.y);
      ctx.y += 6;
    }
    ctx.y += 1;
  }

  if (lesson.originalText) {
    ensureRoom(ctx, 10);
    doc.setFont('times', 'italic');
    doc.setFontSize(FONT.body + 2);
    doc.setTextColor(50);
    const origLines = doc.splitTextToSize(lesson.originalText, ctx.bodyWidth * 0.85);
    for (const line of origLines) {
      ensureRoom(ctx, 6);
      doc.text(line, ctx.pageWidth / 2, ctx.y, { align: 'center' });
      ctx.y += 5.5;
    }
    if (lesson.originalLanguage) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONT.meta - 1);
      doc.setTextColor(140);
      doc.text(
        lesson.originalLanguage.toUpperCase(),
        ctx.pageWidth / 2,
        ctx.y,
        { align: 'center' },
      );
      ctx.y += 4;
    }
    ctx.y += 2;
  }

  // Body fragments
  const fragments = splitSynthesis(lesson.body);
  doc.setFont('times', 'normal');
  doc.setFontSize(FONT.body + 1);
  doc.setTextColor(30);
  const sourceById = new Map(data.sources.map((s) => [s.id, s]));
  for (let i = 0; i < fragments.length; i++) {
    const frag = fragments[i];
    const fragIds = lesson.bodyAttributions?.[i] ?? [];
    const fragNames = fragIds
      .map((id) => sourceById.get(id)?.name)
      .filter((n): n is string => !!n);
    const bodyText = fragNames.length
      ? `${frag}  — ${fragNames.join(', ')}`
      : frag;
    const lines = doc.splitTextToSize(bodyText, ctx.bodyWidth);
    for (const line of lines) {
      ensureRoom(ctx, LINE.body);
      doc.text(line, MARGIN.left, ctx.y);
      ctx.y += LINE.body + 0.5;
    }
    if (i < fragments.length - 1) {
      ctx.y += 1;
      const mid = ctx.pageWidth / 2;
      doc.setDrawColor(180);
      doc.line(mid - 8, ctx.y, mid + 8, ctx.y);
      ctx.y += 3;
    }
  }

  // Lesson-level attribution (when per-fragment wasn't used)
  const hasPerFragment =
    !!lesson.bodyAttributions &&
    lesson.bodyAttributions.some((ids) => ids.length > 0);
  if (!hasPerFragment && lesson.sourceIds.length > 0) {
    const names = lesson.sourceIds
      .map((id) => sourceById.get(id)?.name)
      .filter((n): n is string => !!n);
    if (names.length > 0) {
      ctx.y += 1;
      doc.setFont('times', 'italic');
      doc.setFontSize(FONT.body);
      doc.setTextColor(100);
      doc.text(
        `— ${names.join(' / ')}`,
        ctx.pageWidth - MARGIN.right,
        ctx.y,
        { align: 'right' },
      );
      ctx.y += 4;
    }
  }

  if (options.includeReflections && lesson.reflection) {
    ctx.y += 3;
    ensureRoom(ctx, 12);
    doc.setDrawColor(200);
    doc.setFillColor(245, 245, 242);
    const rx = MARGIN.left;
    const rw = ctx.bodyWidth;
    const refLines = ctx.doc.splitTextToSize(
      lesson.reflection,
      rw - 8,
    );
    const boxHeight = refLines.length * (LINE.body - 0.5) + 10;
    doc.rect(rx, ctx.y - 1, rw, boxHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT.meta);
    doc.setTextColor(140);
    doc.text('— REFLECTION', rx + 4, ctx.y + 4);
    doc.setFont('times', 'normal');
    doc.setFontSize(FONT.body);
    doc.setTextColor(40);
    let ry = ctx.y + 8;
    for (const line of refLines) {
      doc.text(line, rx + 4, ry);
      ry += LINE.body - 0.5;
    }
    ctx.y = ry + 2;
  }

  ctx.y += LINE.section;
  if (ctx.y > ctx.pageHeight - MARGIN.bottom - 20) newPage(ctx);
}

function renderIndexes(
  ctx: RenderContext,
  data: CommonplaceYear,
  scoped: Lesson[],
) {
  const { doc } = ctx;
  const inScope = new Set(scoped.map((l) => l.id));

  // People index
  newPage(ctx);
  doc.setFont('times', 'bold');
  doc.setFontSize(FONT.chapter);
  doc.setTextColor(30);
  doc.text('Index of People', MARGIN.left, ctx.y);
  ctx.y += 10;
  const sortedSources = [...data.sources].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  doc.setFont('times', 'normal');
  doc.setFontSize(FONT.body);
  doc.setTextColor(40);
  for (const s of sortedSources) {
    const citing = data.lessons
      .filter((l) => l.sourceIds.includes(s.id) && inScope.has(l.id))
      .map((l) => l.number);
    if (citing.length === 0) continue;
    ensureRoom(ctx, LINE.body + 1);
    doc.text(
      `${s.name}${s.lifeYears ? ` (${s.lifeYears})` : ''} — ${citing.join(', ')}`,
      MARGIN.left,
      ctx.y,
    );
    ctx.y += LINE.body + 0.5;
  }

  // Theme index
  newPage(ctx);
  doc.setFont('times', 'bold');
  doc.setFontSize(FONT.chapter);
  doc.setTextColor(30);
  doc.text('Index of Themes', MARGIN.left, ctx.y);
  ctx.y += 10;
  doc.setFont('times', 'normal');
  doc.setFontSize(FONT.body);
  doc.setTextColor(40);
  const sortedThemes = [...data.themes].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const t of sortedThemes) {
    const citing = data.lessons
      .filter((l) => l.themeIds.includes(t.id) && inScope.has(l.id))
      .map((l) => l.number);
    if (citing.length === 0) continue;
    ensureRoom(ctx, LINE.body + 1);
    doc.text(`${t.name} — ${citing.join(', ')}`, MARGIN.left, ctx.y);
    ctx.y += LINE.body + 0.5;
  }

  // Bibliography
  newPage(ctx);
  doc.setFont('times', 'bold');
  doc.setFontSize(FONT.chapter);
  doc.setTextColor(30);
  doc.text('Bibliography', MARGIN.left, ctx.y);
  ctx.y += 10;
  const sortedRefs = [...data.references].sort((a, b) =>
    (a.author ?? '').localeCompare(b.author ?? ''),
  );
  doc.setFont('times', 'normal');
  doc.setFontSize(FONT.body);
  doc.setTextColor(40);
  for (const r of sortedRefs) {
    ensureRoom(ctx, LINE.body * 2);
    const citation =
      `${r.author ? r.author + '. ' : ''}${r.title}${r.year ? ` (${r.year})` : ''}.`;
    const lines = doc.splitTextToSize(citation, ctx.bodyWidth);
    for (const line of lines) {
      doc.text(line, MARGIN.left, ctx.y);
      ctx.y += LINE.body - 0.5;
    }
    ctx.y += 1;
  }
}
