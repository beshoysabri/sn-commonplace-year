import type {
  CommonplaceYear,
  Lesson,
  Reference,
  Source,
  Theme,
} from '../types/commonplace';

export interface SearchResult {
  lessons: Lesson[];
  sources: Source[];
  themes: Theme[];
  references: Reference[];
}

function norm(s: string | undefined): string {
  return (s ?? '').toLowerCase();
}

export function filterLessons(
  lessons: Lesson[],
  data: CommonplaceYear,
  query: string,
): Lesson[] {
  const q = query.trim().toLowerCase();
  if (!q) return lessons;
  const sourceName = new Map(data.sources.map((s) => [s.id, s.name.toLowerCase()]));
  const themeName = new Map(data.themes.map((t) => [t.id, t.name.toLowerCase()]));
  const refTitle = new Map(
    data.references.map((r) => [r.id, r.title.toLowerCase()]),
  );
  return lessons.filter((l) => {
    if (norm(l.title).includes(q)) return true;
    if (norm(l.body).includes(q)) return true;
    if (norm(l.reflection).includes(q)) return true;
    if (norm(l.number).includes(q)) return true;
    if (norm(l.originalText).includes(q)) return true;
    for (const id of l.sourceIds) {
      if ((sourceName.get(id) ?? '').includes(q)) return true;
    }
    for (const id of l.themeIds) {
      if ((themeName.get(id) ?? '').includes(q)) return true;
    }
    if (l.referenceId && (refTitle.get(l.referenceId) ?? '').includes(q)) {
      return true;
    }
    return false;
  });
}

export function searchAll(
  data: CommonplaceYear,
  query: string,
): SearchResult {
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      lessons: data.lessons,
      sources: data.sources,
      themes: data.themes,
      references: data.references,
    };
  }
  return {
    lessons: filterLessons(data.lessons, data, q),
    sources: data.sources.filter(
      (s) =>
        norm(s.name).includes(q) ||
        norm(s.role).includes(q) ||
        norm(s.notes).includes(q),
    ),
    themes: data.themes.filter(
      (t) => norm(t.name).includes(q) || norm(t.description).includes(q),
    ),
    references: data.references.filter(
      (r) =>
        norm(r.title).includes(q) ||
        norm(r.author).includes(q) ||
        norm(r.notes).includes(q),
    ),
  };
}
