import type { CommonplaceYear, Lesson, Source } from '../types/commonplace';

/**
 * Split a synthesis body like "quote A / quote B / quote C" into fragments.
 * Accepts both inline (" / ") and end-of-line (" /\n") separators, so a
 * lesson like 23#2 (five quotes, one per line) renders as 5 fragments.
 */
export function splitSynthesis(body: string): string[] {
  if (!body) return [];
  if (!body.includes('/')) return [body];
  const normalized = body
    .replace(/\s+\/\s+/g, '\n/\n')
    .replace(/\s+\/$/gm, '\n/');
  const parts = normalized
    .split(/^\/$/m)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  return parts.length > 0 ? parts : [body];
}

/**
 * Zip fragments with their per-fragment attributions, resolving UUIDs to
 * Source objects. Missing / malformed entries collapse to empty arrays.
 */
export function fragmentsWithAttributions(
  lesson: Lesson,
  data: CommonplaceYear,
): Array<{ text: string; sources: Source[] }> {
  const fragments = splitSynthesis(lesson.body);
  return fragments.map((text, i) => {
    const ids = lesson.bodyAttributions?.[i] ?? [];
    const sources = ids
      .map((id) => data.sources.find((s) => s.id === id))
      .filter((s): s is Source => !!s);
    return { text, sources };
  });
}

export function hasPerFragmentAttribution(lesson: Lesson): boolean {
  return (
    !!lesson.bodyAttributions &&
    lesson.bodyAttributions.some((ids) => ids.length > 0)
  );
}
