import { v4 as uuid } from 'uuid';
import type {
  CommonplaceYear,
  CommonplaceSettings,
  Lesson,
  Reference,
  Source,
  Theme,
  ViewMode,
  SourceKind,
  ReferenceKind,
  ReferenceStatus,
  Rating,
  UUID,
} from '../types/commonplace';
import {
  DEFAULT_SETTINGS,
  SOURCE_KINDS,
  REFERENCE_KINDS,
  REFERENCE_STATUSES,
  VIEW_MODES,
} from '../types/commonplace';

// =============================================================
// Parser / serializer for the commonplace-book markdown grammar.
// Grammar reference: SPEC.md §6.
//
// Contract: parseMarkdown(serializeMarkdown(x)) deep-equals x
// (modulo updatedAt, which is a timestamp the caller refreshes
// on save).
// =============================================================

const DEFAULT_SOURCE_COLOR = '#4C6B8A';
const DEFAULT_THEME_COLOR = '#6B8E23';

const SECTION_SEPARATOR = '---';

const BODY_INDENT = '    ';
const FIELD_INDENT = '  ';

function nowIso(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------
// Attribute helpers: [key:value] [key2:value2]
// ---------------------------------------------------------------

const ATTR_RE = /\[([a-zA-Z]+):([^\]]*)\]/g;

function parseAttrs(line: string): Record<string, string> {
  const out: Record<string, string> = {};
  let match: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;
  while ((match = ATTR_RE.exec(line)) !== null) {
    out[match[1]] = match[2].trim();
  }
  return out;
}

function stripAttrs(line: string): string {
  return line.replace(ATTR_RE, '').trim();
}

function formatAttr(key: string, value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  return `[${key}:${value}]`;
}

function joinAttrs(pairs: string[]): string {
  const parts = pairs.filter((p) => p.length > 0);
  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

// ---------------------------------------------------------------
// Entity header: `@source: Carl Jung [kind:person] [years:...]`
// ---------------------------------------------------------------

function parseEntityHeader(
  line: string,
  entityKey: string,
): { identifier: string; attrs: Record<string, string> } | null {
  const prefix = `@${entityKey}:`;
  if (!line.startsWith(prefix)) return null;
  const rest = line.slice(prefix.length).trim();
  const attrs = parseAttrs(rest);
  const identifier = stripAttrs(rest);
  return { identifier, attrs };
}

// ---------------------------------------------------------------
// Boolean & list coercions
// ---------------------------------------------------------------

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const v = value.trim().toLowerCase();
  if (v === 'yes' || v === 'true' || v === '1') return true;
  if (v === 'no' || v === 'false' || v === '0' || v === '') return false;
  return fallback;
}

function serializeBool(v: boolean): string {
  return v ? 'yes' : 'no';
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseRating(value: string | undefined): Rating | undefined {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return n;
  return undefined;
}

function parseYear(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

function isViewMode(v: string): v is ViewMode {
  return (VIEW_MODES as readonly string[]).includes(v);
}

function isSourceKind(v: string): v is SourceKind {
  return (SOURCE_KINDS as readonly string[]).includes(v);
}

function isReferenceKind(v: string): v is ReferenceKind {
  return (REFERENCE_KINDS as readonly string[]).includes(v);
}

function isReferenceStatus(v: string): v is ReferenceStatus {
  return (REFERENCE_STATUSES as readonly string[]).includes(v);
}

// ---------------------------------------------------------------
// Section splitting
// ---------------------------------------------------------------

function splitSections(raw: string): string[][] {
  const lines = raw.split(/\r?\n/);
  const sections: string[][] = [[]];
  for (const line of lines) {
    if (line.trim() === SECTION_SEPARATOR) {
      sections.push([]);
    } else {
      sections[sections.length - 1].push(line);
    }
  }
  return sections;
}

// ---------------------------------------------------------------
// Metadata section parser (section 0 includes @summary block).
// ---------------------------------------------------------------

interface MetadataResult {
  year: number;
  theme?: string;
  summary?: string;
  settings: CommonplaceSettings;
  createdAt?: string;
  updatedAt?: string;
}

function parseMetadataSection(lines: string[]): MetadataResult {
  const settings: CommonplaceSettings = { ...DEFAULT_SETTINGS };
  let year: number = new Date().getFullYear();
  let theme: string | undefined;
  let summary: string | undefined;
  let createdAt: string | undefined;
  let updatedAt: string | undefined;

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();
    if (line.trim().length === 0) {
      i += 1;
      continue;
    }
    // Multi-line @summary block
    if (line.trimStart() === '@summary:') {
      const collected: string[] = [];
      i += 1;
      while (i < lines.length) {
        const next = lines[i];
        // Stop when we hit a top-level @key: line (not indented)
        if (/^@[a-zA-Z]/.test(next.trimStart()) && !next.startsWith(' ')) {
          break;
        }
        collected.push(next);
        i += 1;
      }
      // Strip common leading whitespace (2 spaces, consistent with grammar)
      summary = dedentBlock(collected).trim() || undefined;
      continue;
    }

    const m = line.match(/^@([a-zA-Z][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!m) {
      i += 1;
      continue;
    }
    const key = m[1];
    const value = m[2].trim();

    switch (key) {
      case 'commonplace':
      case 'version':
        break;
      case 'year': {
        const y = parseYear(value);
        if (y !== undefined) year = y;
        break;
      }
      case 'theme':
        if (value) theme = value;
        break;
      case 'numberFormat':
        if (value) settings.numberFormat = value;
        break;
      case 'defaultView':
        if (isViewMode(value)) settings.defaultView = value;
        break;
      case 'paperMode':
        settings.paperMode = parseBool(value, settings.paperMode);
        break;
      case 'showNumbersInBookView':
        settings.showNumbersInBookView = parseBool(
          value,
          settings.showNumbersInBookView,
        );
        break;
      case 'autoNumber':
        settings.autoNumber = parseBool(value, settings.autoNumber);
        break;
      case 'createdAt':
        if (value) createdAt = value;
        break;
      case 'updatedAt':
        if (value) updatedAt = value;
        break;
    }
    i += 1;
  }

  return { year, theme, summary, settings, createdAt, updatedAt };
}

// ---------------------------------------------------------------
// Generic indented-block reader.
// ---------------------------------------------------------------

/**
 * Strip the minimum common leading whitespace from non-empty lines.
 * Preserves relative indentation.
 */
function dedentBlock(lines: string[]): string {
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length === 0) return '';
  const indents = nonEmpty.map((l) => l.match(/^(\s*)/)![1].length);
  const minIndent = Math.min(...indents);
  return lines.map((l) => (l.length >= minIndent ? l.slice(minIndent) : l)).join('\n');
}

function indentBlock(text: string, indent: string): string {
  return text
    .split('\n')
    .map((l) => (l.length > 0 ? indent + l : l))
    .join('\n');
}

// ---------------------------------------------------------------
// Themes section.
// ---------------------------------------------------------------

function parseThemesSection(lines: string[]): Theme[] {
  const themes: Theme[] = [];
  let current: Theme | null = null;
  let descLines: string[] = [];

  const flush = () => {
    if (current) {
      const desc = dedentBlock(descLines).trim();
      if (desc) current.description = desc;
      themes.push(current);
    }
    current = null;
    descLines = [];
  };

  for (const raw of lines) {
    const trimmed = raw.trimStart();
    if (trimmed.startsWith('@theme:')) {
      flush();
      const parsed = parseEntityHeader(trimmed, 'theme');
      if (!parsed || !parsed.identifier) continue;
      const color = parsed.attrs.color || DEFAULT_THEME_COLOR;
      current = {
        id: uuid(),
        name: parsed.identifier,
        color,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
    } else if (current) {
      descLines.push(raw);
    }
  }
  flush();
  return themes;
}

// ---------------------------------------------------------------
// Sources section.
// ---------------------------------------------------------------

function parseSourcesSection(lines: string[]): Source[] {
  const sources: Source[] = [];
  let current: Source | null = null;
  let notesLines: string[] = [];

  const flush = () => {
    if (current) {
      const notes = dedentBlock(notesLines).trim();
      if (notes) current.notes = notes;
      sources.push(current);
    }
    current = null;
    notesLines = [];
  };

  for (const raw of lines) {
    const trimmed = raw.trimStart();
    if (trimmed.startsWith('@source:')) {
      flush();
      const parsed = parseEntityHeader(trimmed, 'source');
      if (!parsed || !parsed.identifier) continue;
      const kindRaw = parsed.attrs.kind;
      const kind: SourceKind = kindRaw && isSourceKind(kindRaw) ? kindRaw : 'person';
      const color = parsed.attrs.color || DEFAULT_SOURCE_COLOR;
      current = {
        id: uuid(),
        name: parsed.identifier,
        kind,
        color,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      if (parsed.attrs.years) current.lifeYears = parsed.attrs.years;
      if (parsed.attrs.role) current.role = parsed.attrs.role;
      if (parsed.attrs.avatar) current.avatarUrl = parsed.attrs.avatar;
      const rev = parseRating(parsed.attrs.reverence);
      if (rev !== undefined) current.reverence = rev;
    } else if (current) {
      notesLines.push(raw);
    }
  }
  flush();
  return sources;
}

// ---------------------------------------------------------------
// References section.
// ---------------------------------------------------------------

function parseReferencesSection(lines: string[]): Reference[] {
  const refs: Reference[] = [];
  let current: Reference | null = null;
  let notesLines: string[] = [];

  const flush = () => {
    if (current) {
      const notes = dedentBlock(notesLines).trim();
      if (notes) current.notes = notes;
      refs.push(current);
    }
    current = null;
    notesLines = [];
  };

  for (const raw of lines) {
    const trimmed = raw.trimStart();
    if (trimmed.startsWith('@reference:')) {
      flush();
      const parsed = parseEntityHeader(trimmed, 'reference');
      if (!parsed || !parsed.identifier) continue;
      const kindRaw = parsed.attrs.kind;
      const kind: ReferenceKind =
        kindRaw && isReferenceKind(kindRaw) ? kindRaw : 'book';
      current = {
        id: uuid(),
        title: parsed.identifier,
        kind,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      if (parsed.attrs.author) current.author = parsed.attrs.author;
      const y = parseYear(parsed.attrs.year);
      if (y !== undefined) current.year = y;
      if (parsed.attrs.url) current.url = parsed.attrs.url;
      if (parsed.attrs.cover) current.coverUrl = parsed.attrs.cover;
      if (parsed.attrs.status && isReferenceStatus(parsed.attrs.status)) {
        current.status = parsed.attrs.status;
      }
      const r = parseRating(parsed.attrs.rating);
      if (r !== undefined) current.rating = r;
    } else if (current) {
      notesLines.push(raw);
    }
  }
  flush();
  return refs;
}

// ---------------------------------------------------------------
// Lesson section — the most involved.
// ---------------------------------------------------------------

interface LessonAcc {
  id: string;
  number: string;
  title?: string;
  important?: boolean;
  sourceNames: string[];
  themeNames: string[];
  bodySourceNames?: string[][];
  referenceNames: string[];
  originalText?: string;
  originalLanguage?: string;
  date?: string;
  body: string;
  reflection?: string;
  linkedLessonNumbers: string[];
  visibility?: 'private' | 'shareable';
  createdAt?: string;
  updatedAt?: string;
}

function emptyAcc(number: string): LessonAcc {
  return {
    id: uuid(),
    number,
    sourceNames: [],
    themeNames: [],
    referenceNames: [],
    linkedLessonNumbers: [],
    body: '',
  };
}

type LessonField =
  | 'title'
  | 'important'
  | 'sources'
  | 'themes'
  | 'reference'
  | 'references'
  | 'original'
  | 'originalLanguage'
  | 'date'
  | 'body'
  | 'bodySources'
  | 'reflection'
  | 'linkedLessons'
  | 'visibility'
  | 'createdAt'
  | 'updatedAt';

function parseLessonsSection(lines: string[]): LessonAcc[] {
  const accs: LessonAcc[] = [];
  let current: LessonAcc | null = null;
  let multilineField: LessonField | null = null;
  let multilineBuffer: string[] = [];

  const commitMultiline = () => {
    if (!current || !multilineField) return;
    const text = dedentBlock(multilineBuffer).replace(/\s+$/, '');
    if (multilineField === 'body') {
      current.body = text;
    } else if (multilineField === 'reflection') {
      current.reflection = text || undefined;
    } else if (multilineField === 'bodySources') {
      // One line per fragment. Each line: comma-separated source names.
      // Empty lines = no per-fragment attribution for that fragment.
      const lines = text.split('\n');
      current.bodySourceNames = lines.map((l) => parseList(l));
    } else if (multilineField === 'references') {
      // One reference title per line (titles may contain commas, so we
      // don't split on commas the way @sources / @themes do).
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      for (const line of lines) current.referenceNames.push(line);
    }
    multilineField = null;
    multilineBuffer = [];
  };

  const flush = () => {
    commitMultiline();
    if (current) accs.push(current);
    current = null;
  };

  for (const raw of lines) {
    const trimStart = raw.trimStart();

    // New lesson
    if (trimStart.startsWith('@lesson:')) {
      flush();
      const parsed = parseEntityHeader(trimStart, 'lesson');
      current = emptyAcc(parsed?.identifier?.trim() || '');
      continue;
    }

    if (!current) continue;

    // Are we inside a multi-line field? Detect "field continues" vs "new field".
    if (multilineField) {
      // A line at 2-space indent starting with `@` ends the multi-line field.
      const fieldLineMatch = raw.match(/^ {2}@([a-zA-Z]+):\s*(.*)$/);
      if (fieldLineMatch) {
        commitMultiline();
        // fall through to field-handling below
      } else {
        multilineBuffer.push(raw);
        continue;
      }
    }

    // Single-line / field-opening lines use 2-space indent.
    const fm = raw.match(/^ {2}@([a-zA-Z]+):\s*(.*)$/);
    if (!fm) {
      // Not a recognized lesson field line; ignore.
      continue;
    }
    const key = fm[1] as LessonField;
    const rest = fm[2];

    switch (key) {
      case 'title':
        current.title = rest.trim() || undefined;
        break;
      case 'important':
        current.important = parseBool(rest, false);
        break;
      case 'sources':
        current.sourceNames = parseList(rest);
        break;
      case 'themes':
        current.themeNames = parseList(rest);
        break;
      case 'reference':
        // Legacy single-value form (pre-v0.2). Still accepted on parse.
        if (rest.trim()) current.referenceNames.push(rest.trim());
        break;
      case 'references':
        if (rest.trim()) {
          // Inline single title (keeps short lessons terse).
          current.referenceNames.push(rest.trim());
        } else {
          multilineField = 'references';
          multilineBuffer = [];
        }
        break;
      case 'original':
        current.originalText = rest.trim() || undefined;
        break;
      case 'originalLanguage':
        current.originalLanguage = rest.trim() || undefined;
        break;
      case 'date':
        current.date = rest.trim() || undefined;
        break;
      case 'linkedLessons':
        current.linkedLessonNumbers = parseList(rest);
        break;
      case 'visibility': {
        const v = rest.trim();
        if (v === 'private' || v === 'shareable') current.visibility = v;
        break;
      }
      case 'createdAt':
        if (rest.trim()) current.createdAt = rest.trim();
        break;
      case 'updatedAt':
        if (rest.trim()) current.updatedAt = rest.trim();
        break;
      case 'body':
      case 'reflection': {
        // Multi-line: rest of line (after colon) is empty by grammar,
        // but we accept inline content too.
        if (rest.trim()) {
          if (key === 'body') current.body = rest.trim();
          else current.reflection = rest.trim();
          break;
        }
        multilineField = key;
        multilineBuffer = [];
        break;
      }
      case 'bodySources': {
        if (rest.trim()) {
          // Inline form: single fragment, comma-separated names.
          current.bodySourceNames = [parseList(rest)];
          break;
        }
        multilineField = key;
        multilineBuffer = [];
        break;
      }
    }
  }
  flush();

  return accs;
}

// ---------------------------------------------------------------
// Name → id resolution for lessons, with permissive creation.
// ---------------------------------------------------------------

function resolveLessonRefs(
  accs: LessonAcc[],
  sources: Source[],
  themes: Theme[],
  references: Reference[],
): Lesson[] {
  const sourceByName = new Map(sources.map((s) => [s.name, s]));
  const themeByName = new Map(themes.map((t) => [t.name, t]));
  const refByTitle = new Map(references.map((r) => [r.title, r]));

  // First pass: accs carry number → id lookup for linkedLessons.
  const numberToId = new Map<string, string>();
  for (const a of accs) numberToId.set(a.number, a.id);

  const resolveSourceName = (name: string): string => {
    const existing = sourceByName.get(name);
    if (existing) return existing.id;
    const s: Source = {
      id: uuid(),
      name,
      kind: 'person',
      color: DEFAULT_SOURCE_COLOR,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    sources.push(s);
    sourceByName.set(name, s);
    return s.id;
  };

  return accs.map<Lesson>((a) => {
    const sourceIds = a.sourceNames.map(resolveSourceName);

    // Per-fragment attributions. Also merge any unique per-fragment sources
    // into the lesson-level sourceIds so the People view still indexes them.
    let bodyAttributions: UUID[][] | undefined;
    if (a.bodySourceNames && a.bodySourceNames.length > 0) {
      bodyAttributions = a.bodySourceNames.map((names) =>
        names.map(resolveSourceName),
      );
      for (const ids of bodyAttributions) {
        for (const id of ids) {
          if (!sourceIds.includes(id)) sourceIds.push(id);
        }
      }
    }

    const themeIds = a.themeNames.map((name) => {
      const existing = themeByName.get(name);
      if (existing) return existing.id;
      const t: Theme = {
        id: uuid(),
        name,
        color: DEFAULT_THEME_COLOR,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      themes.push(t);
      themeByName.set(name, t);
      return t.id;
    });

    const referenceIds: UUID[] = a.referenceNames.map((title) => {
      const existing = refByTitle.get(title);
      if (existing) return existing.id;
      const newRef: Reference = {
        id: uuid(),
        title,
        kind: 'book',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      references.push(newRef);
      refByTitle.set(title, newRef);
      return newRef.id;
    });

    const linkedLessonIds = a.linkedLessonNumbers
      .map((n) => numberToId.get(n))
      .filter((id): id is string => !!id);

    const createdAt = a.createdAt ?? nowIso();
    const updatedAt = a.updatedAt ?? createdAt;

    const lesson: Lesson = {
      id: a.id,
      number: a.number,
      body: a.body,
      important: a.important ?? false,
      sourceIds,
      themeIds,
      referenceIds,
      linkedLessonIds,
      visibility: a.visibility ?? 'private',
      createdAt,
      updatedAt,
    };
    if (a.title) lesson.title = a.title;
    if (a.date) lesson.date = a.date;
    if (a.originalText) lesson.originalText = a.originalText;
    if (a.originalLanguage) lesson.originalLanguage = a.originalLanguage;
    if (a.reflection) lesson.reflection = a.reflection;
    if (bodyAttributions) lesson.bodyAttributions = bodyAttributions;

    return lesson;
  });
}

// ---------------------------------------------------------------
// Top-level parse.
// ---------------------------------------------------------------

export function parseMarkdown(raw: string): CommonplaceYear {
  const trimmed = raw.trimStart();

  // Legacy fallback: not our format.
  if (!trimmed.startsWith('@commonplace:')) {
    return legacyFallback(raw);
  }

  const sections = splitSections(raw);
  const meta = parseMetadataSection(sections[0] ?? []);
  const themes = parseThemesSection(sections[1] ?? []);
  const sources = parseSourcesSection(sections[2] ?? []);
  const references = parseReferencesSection(sections[3] ?? []);
  const lessonSection = (sections.slice(4) ?? []).flat();
  const lessonAccs = parseLessonsSection(lessonSection);
  const lessons = resolveLessonRefs(lessonAccs, sources, themes, references);

  const createdAt = meta.createdAt ?? nowIso();
  const updatedAt = meta.updatedAt ?? createdAt;

  const year: CommonplaceYear = {
    version: 1,
    year: meta.year,
    settings: meta.settings,
    lessons,
    sources,
    references,
    themes,
    createdAt,
    updatedAt,
  };
  if (meta.theme) year.theme = meta.theme;
  if (meta.summary) year.summary = meta.summary;

  return year;
}

// ---------------------------------------------------------------
// Legacy fallback — preserves raw content, best-effort lesson extract.
// ---------------------------------------------------------------

export function legacyFallback(raw: string): CommonplaceYear {
  const now = nowIso();
  const currentYear = new Date().getFullYear();
  const year: CommonplaceYear = {
    version: 1,
    year: currentYear,
    settings: { ...DEFAULT_SETTINGS },
    lessons: [],
    sources: [],
    references: [],
    themes: [],
    createdAt: now,
    updatedAt: now,
    rawFallback: raw,
  };
  return year;
}

// ---------------------------------------------------------------
// Serializer.
// ---------------------------------------------------------------

export function serializeMarkdown(data: CommonplaceYear): string {
  const out: string[] = [];

  // Metadata block
  out.push('@commonplace: year');
  out.push(`@version: ${data.version}`);
  out.push(`@year: ${data.year}`);
  if (data.theme) out.push(`@theme: ${data.theme}`);
  out.push(`@numberFormat: ${data.settings.numberFormat}`);
  out.push(`@defaultView: ${data.settings.defaultView}`);
  out.push(`@paperMode: ${serializeBool(data.settings.paperMode)}`);
  out.push(
    `@showNumbersInBookView: ${serializeBool(data.settings.showNumbersInBookView)}`,
  );
  out.push(`@autoNumber: ${serializeBool(data.settings.autoNumber)}`);
  out.push(`@createdAt: ${data.createdAt}`);
  out.push(`@updatedAt: ${data.updatedAt}`);

  if (data.summary) {
    out.push('');
    out.push('@summary:');
    out.push(indentBlock(data.summary, FIELD_INDENT));
  }

  out.push('');
  out.push(SECTION_SEPARATOR);
  out.push('');

  // Themes
  for (const t of data.themes) {
    const attrs = joinAttrs([formatAttr('color', t.color)]);
    out.push(`@theme: ${t.name}${attrs}`);
    if (t.description) {
      out.push(indentBlock(t.description, FIELD_INDENT));
    }
    out.push('');
  }

  out.push(SECTION_SEPARATOR);
  out.push('');

  // Sources
  for (const s of data.sources) {
    const attrs = joinAttrs([
      formatAttr('kind', s.kind),
      formatAttr('years', s.lifeYears),
      formatAttr('role', s.role),
      formatAttr('avatar', s.avatarUrl),
      formatAttr('reverence', s.reverence),
      formatAttr('color', s.color),
    ]);
    out.push(`@source: ${s.name}${attrs}`);
    if (s.notes) {
      out.push(indentBlock(s.notes, FIELD_INDENT));
    }
    out.push('');
  }

  out.push(SECTION_SEPARATOR);
  out.push('');

  // References
  for (const r of data.references) {
    const attrs = joinAttrs([
      formatAttr('author', r.author),
      formatAttr('kind', r.kind),
      formatAttr('year', r.year),
      formatAttr('url', r.url),
      formatAttr('cover', r.coverUrl),
      formatAttr('status', r.status),
      formatAttr('rating', r.rating),
    ]);
    out.push(`@reference: ${r.title}${attrs}`);
    if (r.notes) {
      out.push(indentBlock(r.notes, FIELD_INDENT));
    }
    out.push('');
  }

  out.push(SECTION_SEPARATOR);
  out.push('');

  // Lessons
  const sourceById = new Map(data.sources.map((s) => [s.id, s]));
  const themeById = new Map(data.themes.map((t) => [t.id, t]));
  const refById = new Map(data.references.map((r) => [r.id, r]));
  const numberById = new Map(data.lessons.map((l) => [l.id, l.number]));

  for (const l of data.lessons) {
    out.push(`@lesson: ${l.number}`);
    if (l.title) out.push(`${FIELD_INDENT}@title: ${l.title}`);
    out.push(`${FIELD_INDENT}@important: ${serializeBool(l.important)}`);
    if (l.date) out.push(`${FIELD_INDENT}@date: ${l.date}`);
    const sourceNames = l.sourceIds
      .map((id) => sourceById.get(id)?.name)
      .filter((n): n is string => !!n);
    out.push(`${FIELD_INDENT}@sources: ${sourceNames.join(', ')}`);
    const themeNames = l.themeIds
      .map((id) => themeById.get(id)?.name)
      .filter((n): n is string => !!n);
    out.push(`${FIELD_INDENT}@themes: ${themeNames.join(', ')}`);
    if (l.referenceIds.length > 0) {
      const titles = l.referenceIds
        .map((id) => refById.get(id)?.title)
        .filter((t): t is string => !!t);
      if (titles.length === 1) {
        out.push(`${FIELD_INDENT}@references: ${titles[0]}`);
      } else if (titles.length > 1) {
        out.push(`${FIELD_INDENT}@references:`);
        for (const t of titles) out.push(`${BODY_INDENT}${t}`);
      }
    }
    if (l.originalText) {
      out.push(`${FIELD_INDENT}@original: ${l.originalText}`);
    }
    if (l.originalLanguage) {
      out.push(`${FIELD_INDENT}@originalLanguage: ${l.originalLanguage}`);
    }
    if (l.linkedLessonIds.length > 0) {
      const linkedNumbers = l.linkedLessonIds
        .map((id) => numberById.get(id))
        .filter((n): n is string => !!n);
      if (linkedNumbers.length > 0) {
        out.push(`${FIELD_INDENT}@linkedLessons: ${linkedNumbers.join(', ')}`);
      }
    }
    out.push(`${FIELD_INDENT}@visibility: ${l.visibility}`);
    out.push(`${FIELD_INDENT}@createdAt: ${l.createdAt}`);
    out.push(`${FIELD_INDENT}@updatedAt: ${l.updatedAt}`);

    // Body (always present, multi-line)
    out.push(`${FIELD_INDENT}@body:`);
    out.push(indentBlock(l.body, BODY_INDENT));

    // Per-fragment attributions, if any.
    if (l.bodyAttributions && l.bodyAttributions.length > 0) {
      out.push(`${FIELD_INDENT}@bodySources:`);
      for (const ids of l.bodyAttributions) {
        const names = ids
          .map((id) => sourceById.get(id)?.name)
          .filter((n): n is string => !!n);
        out.push(`${BODY_INDENT}${names.join(', ')}`);
      }
    }

    if (l.reflection) {
      out.push(`${FIELD_INDENT}@reflection:`);
      out.push(indentBlock(l.reflection, BODY_INDENT));
    }

    out.push('');
  }

  // Trim trailing blank lines into a single newline
  return out.join('\n').replace(/\n+$/, '\n');
}
