/**
 * Import the bullet-list markdown format that some users have been
 * collecting their lessons in. Looks like:
 *
 *   2024|CODE
 *
 *   - 24#01
 *       - "Quote text"
 *         — Hazrat Inayat Khan
 *   - 24#02
 *       - First fragment /
 *         Second fragment
 *         — Source A / Source B
 *
 * Tolerates: zero-padded numbers, smart quotes, attributions split with
 * / or \, multi-line bodies, multi-bullet bodies, missing attributions,
 * inline `"/"` (no spaces) synthesis separators, mixed em-dash variants.
 */

export interface ImportedLesson {
  number: string;
  body: string;
  /** Sources resolved for this lesson — lesson-level union. */
  sourceNames: string[];
  /** Per-fragment attribution when fragment count matches source count
   * AND there is more than one fragment. */
  bodyAttributionNames?: string[][];
}

export interface ImportResult {
  year?: number;
  theme?: string;
  lessons: ImportedLesson[];
  warnings: string[];
}

// em-dash (—), horizontal-bar (―), or ASCII double-hyphen.
const ATTR_PREFIX = /^\s*(?:[\u2014\u2015]+|--)\s*/;
// Loose separator: bare "/" or "\" with optional whitespace either side.
const LOOSE_SOURCE_SEPARATOR = /\s*[/\\]\s*/;
// Strict separator: requires whitespace either side, so "Latin/English
// Proverb" stays one source name.
const STRICT_SOURCE_SEPARATOR = /\s+[/\\]\s+/;

export function parseBulletImport(raw: string): ImportResult {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const result: ImportResult = { lessons: [], warnings: [] };

  let i = 0;

  // 1. Optional first non-blank line: YEAR|THEME (or just YEAR).
  while (i < lines.length && lines[i].trim() === '') i++;
  if (i < lines.length) {
    const header = lines[i].trim();
    const m = header.match(/^(\d{4})(?:\s*[|·-]\s*(.+))?$/);
    if (m) {
      result.year = Number(m[1]);
      const theme = m[2]?.trim();
      if (theme) result.theme = theme;
      i++;
    }
  }

  // 2. Walk to first lesson header.
  while (i < lines.length) {
    if (isLessonHeader(lines[i])) break;
    i++;
  }

  // 3. Parse each lesson block.
  while (i < lines.length) {
    if (!isLessonHeader(lines[i])) {
      i++;
      continue;
    }
    const number = extractLessonNumber(lines[i]);
    i++;
    // Collect body lines until next lesson header or EOF.
    const bodyLines: string[] = [];
    while (i < lines.length && !isLessonHeader(lines[i])) {
      bodyLines.push(lines[i]);
      i++;
    }
    const lesson = buildLesson(number, bodyLines, result.warnings);
    if (lesson) result.lessons.push(lesson);
  }

  return result;
}

function isLessonHeader(line: string): boolean {
  return /^\s*-\s+\d+\s*[#.]-?\d+\b/.test(line);
}

function extractLessonNumber(line: string): string {
  // "- 24#01" → "24#01"; "  - 2024.1" → "2024.1"
  const m = line.match(/^\s*-\s+([0-9]+\s*[#.]-?[0-9]+(?:[A-Za-z]?)?)/);
  if (!m) return line.trim().replace(/^-+\s*/, '');
  return m[1].replace(/\s+/g, '');
}

function buildLesson(
  number: string,
  rawBodyLines: string[],
  warnings: string[],
): ImportedLesson | null {
  // 1. Strip the leading "    - " prefix from the FIRST sub-bullet of the
  //    lesson, then dedent the rest. Multi-bullet lessons (like 24#33)
  //    lose their inner bullet markers but keep their content as separate
  //    paragraphs joined into the body.
  const cleaned = rawBodyLines
    .map((l) => l.replace(/^\t+/g, '  ')) // tabs → 2-space units
    .map((l) => stripBulletPrefix(l))
    .join('\n');

  // Trim leading/trailing blank lines.
  const trimmed = cleaned.replace(/^\n+|\n+$/g, '');
  if (!trimmed) return null;

  // 2. Find the attribution line: last non-empty line that starts with
  //    em-dash, horizontal-bar, or double-hyphen.
  const lines = trimmed.split('\n');
  let attrIdx = -1;
  for (let j = lines.length - 1; j >= 0; j--) {
    const t = lines[j].trim();
    if (t === '') continue;
    if (ATTR_PREFIX.test(t)) {
      attrIdx = j;
    }
    break;
  }

  let bodyText: string;

  // 3. Normalize fragment separators so we can split fragments later.
  //    Specifically, the user's `"/"` (no whitespace between quotes) becomes
  //    `" / "`.
  let attrLineRaw = '';
  if (attrIdx >= 0) {
    bodyText = lines.slice(0, attrIdx).join('\n').replace(/\s+$/, '');
    attrLineRaw = lines[attrIdx];
  } else {
    bodyText = trimmed;
  }
  bodyText = bodyText.replace(/"\s*\/\s*"/g, '" / "');

  // 4. Detect fragments and per-fragment attribution.
  const fragments = splitFragments(bodyText);

  // Try strict (whitespace-required) split first, then loose.
  // Whichever matches fragment count wins — that's how we keep
  // "Latin/English Proverb" as one source while still recognising
  // "Mathew 7:1-5/Carl Jung" as two.
  let sourceNames: string[] = [];
  let bodyAttributionNames: string[][] | undefined;
  if (attrIdx >= 0) {
    const strict = parseAttributionLine(attrLineRaw, STRICT_SOURCE_SEPARATOR);
    const loose = parseAttributionLine(attrLineRaw, LOOSE_SOURCE_SEPARATOR);

    if (fragments.length > 1) {
      if (strict.length === fragments.length) {
        sourceNames = strict;
      } else if (loose.length === fragments.length) {
        sourceNames = loose;
      } else {
        // Counts disagree — prefer the looser parse for the lesson-level
        // union, but warn so the user knows nothing was per-fragment.
        sourceNames = strict.length > 1 ? strict : loose;
        if (sourceNames.length > 1) {
          warnings.push(
            `Lesson ${number}: ${fragments.length} fragments but ${sourceNames.length} sources — keeping as lesson-level attribution.`,
          );
        }
      }
      if (sourceNames.length === fragments.length) {
        bodyAttributionNames = sourceNames.map((n) => [n]);
      }
    } else {
      // Single fragment: use strict (avoids splitting names with slashes).
      sourceNames = strict.length > 0 ? strict : loose;
    }
  }

  return {
    number,
    body: bodyText,
    sourceNames: dedupe(sourceNames),
    bodyAttributionNames,
  };
}

function stripBulletPrefix(line: string): string {
  // Strip a leading "  - " or "    - " (2/4-space + dash + space) marker.
  // Leaves wrapped continuation lines (which start with whitespace but
  // no dash) intact.
  return line.replace(/^(\s*)-\s+/, '$1');
}

function parseAttributionLine(line: string, separator: RegExp): string[] {
  const stripped = line.replace(ATTR_PREFIX, '').trim();
  if (!stripped) return [];
  return stripped
    .split(separator)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Split a body into fragments using the same convention as the live
 * splitSynthesis helper, but a touch more lenient about whitespace.
 */
function splitFragments(body: string): string[] {
  if (!body.includes('/')) return [body];
  // Normalize EOL `/` to its own line.
  const s = body.replace(/\s+\/\s*$/gm, '\n/').replace(/\s+\/\s+/g, '\n/\n');
  // Split on lines containing only `/`.
  const parts = s
    .split(/^\/$/m)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  return parts.length > 0 ? parts : [body.trim()];
}

function dedupe(xs: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}
