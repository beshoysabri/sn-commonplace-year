import { useMemo, useState } from 'react';
import type { CommonplaceYear, Lesson, Source } from '../../types/commonplace';
import { EmptyState } from '../shared/EmptyState';
import { LessonNumberBadge } from '../shared/LessonNumberBadge';
import { PriorityToggle } from '../shared/PriorityToggle';
import { DatePill } from '../shared/DatePill';
import { ThemeChip } from '../shared/ThemeChip';
import { QuillIcon } from '../../lib/icons';
import { splitSynthesis } from '../../lib/fragments';
import { filterLessons } from '../../lib/search';

interface QuotesViewProps {
  data: CommonplaceYear;
  onChange: (next: CommonplaceYear) => void;
  onOpenLesson: (lesson: Lesson) => void;
  showImportantOnly: boolean;
  searchQuery: string;
}

interface QuoteItem {
  key: string;
  lesson: Lesson;
  fragmentIndex: number;
  text: string;
  /** Resolved attribution for THIS fragment. Per-fragment if the lesson
   * has bodyAttributions set, otherwise falls back to the lesson's
   * flat sourceIds union. */
  sources: Source[];
  perFragment: boolean;
}

type QuoteSort = 'lesson' | 'date' | 'source' | 'length';

export function QuotesView({
  data,
  onChange,
  onOpenLesson,
  showImportantOnly,
  searchQuery,
}: QuotesViewProps) {
  const [sort, setSort] = useState<QuoteSort>('lesson');

  const quotes: QuoteItem[] = useMemo(() => {
    let lessons = filterLessons(data.lessons, data, searchQuery);
    if (showImportantOnly) lessons = lessons.filter((l) => l.important);

    const sourceById = new Map(data.sources.map((s) => [s.id, s]));
    const all: QuoteItem[] = [];

    for (const lesson of lessons) {
      const fragments = splitSynthesis(lesson.body);
      for (let i = 0; i < fragments.length; i++) {
        const perFragIds = lesson.bodyAttributions?.[i] ?? [];
        const perFragment = perFragIds.length > 0;
        const ids = perFragment ? perFragIds : lesson.sourceIds;
        const sources = ids
          .map((id) => sourceById.get(id))
          .filter((s): s is Source => !!s);
        all.push({
          key: `${lesson.id}-${i}`,
          lesson,
          fragmentIndex: i,
          text: fragments[i],
          sources,
          perFragment,
        });
      }
    }

    // When searchQuery is set, further narrow to fragments that actually
    // contain the query text (lesson-level match already filtered, but
    // we want the matching fragment to be visible, not siblings).
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      // If the fragment text matches, prefer those; otherwise keep all
      // fragments of matched lessons.
      const matching = all.filter((item) =>
        item.text.toLowerCase().includes(q),
      );
      if (matching.length > 0) return matching;
    }

    return all;
  }, [data, searchQuery, showImportantOnly]);

  const sorted = useMemo(() => {
    const arr = [...quotes];
    switch (sort) {
      case 'lesson':
        arr.sort((a, b) => {
          const byLesson = compareLessonNumbers(
            a.lesson.number,
            b.lesson.number,
          );
          return byLesson !== 0 ? byLesson : a.fragmentIndex - b.fragmentIndex;
        });
        break;
      case 'date':
        arr.sort((a, b) => {
          if (!a.lesson.date && !b.lesson.date) return 0;
          if (!a.lesson.date) return 1;
          if (!b.lesson.date) return -1;
          return a.lesson.date.localeCompare(b.lesson.date);
        });
        break;
      case 'source':
        arr.sort((a, b) => {
          const na = a.sources[0]?.name ?? '';
          const nb = b.sources[0]?.name ?? '';
          return na.localeCompare(nb);
        });
        break;
      case 'length':
        arr.sort((a, b) => a.text.length - b.text.length);
        break;
    }
    return arr;
  }, [quotes, sort]);

  const togglePriority = (lessonId: string) => {
    onChange({
      ...data,
      lessons: data.lessons.map((l) =>
        l.id === lessonId
          ? { ...l, important: !l.important, updatedAt: new Date().toISOString() }
          : l,
      ),
    });
  };

  if (data.lessons.length === 0) {
    return (
      <div className="cp-quotes-view cp-quotes-empty">
        <EmptyState
          icon={<QuillIcon size={32} />}
          title="No quotes yet"
          description={'Quotes are lesson fragments — a lesson split by " / " becomes one quote per fragment.'}
        />
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="cp-quotes-view">
        <EmptyState
          icon={<QuillIcon size={32} />}
          title={
            showImportantOnly ? 'No important quotes' : 'No matching quotes'
          }
          description={
            showImportantOnly
              ? 'Flag any lesson as important to see its quotes here.'
              : 'Try different words, or clear the search.'
          }
        />
      </div>
    );
  }

  return (
    <div className="cp-quotes-view">
      <div className="cp-list-toolbar">
        <label className="cp-list-sort">
          <span>Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as QuoteSort)}
          >
            <option value="lesson">Lesson order</option>
            <option value="date">Date</option>
            <option value="source">Source</option>
            <option value="length">Length</option>
          </select>
        </label>
        <span className="cp-quotes-count">
          {sorted.length} quote{sorted.length === 1 ? '' : 's'}
          {sorted.length !== quotes.length ? ` of ${quotes.length}` : ''}
        </span>
      </div>

      <ul className="cp-quotes-list">
        {sorted.map((q) => (
          <li
            key={q.key}
            className={`cp-quote-card ${q.lesson.important ? 'important' : ''}`}
            onClick={() => onOpenLesson(q.lesson)}
          >
            <div className="cp-quote-head">
              <LessonNumberBadge number={q.lesson.number} />
              {q.lesson.date && <DatePill date={q.lesson.date} />}
              <PriorityToggle
                important={q.lesson.important}
                onToggle={() => togglePriority(q.lesson.id)}
              />
            </div>
            <blockquote className="cp-quote-text">{q.text}</blockquote>
            <div className="cp-quote-footer">
              {q.sources.length > 0 && (
                <span className="cp-quote-attribution">
                  —{' '}
                  {q.sources.reduce<React.ReactNode[]>((acc, s, i) => {
                    if (i > 0)
                      acc.push(<span key={`s-${i}`}> / </span>);
                    acc.push(<span key={s.id}>{s.name}</span>);
                    return acc;
                  }, [])}
                </span>
              )}
              {q.lesson.themeIds.length > 0 && (
                <span className="cp-quote-themes">
                  {q.lesson.themeIds
                    .map((id) => data.themes.find((t) => t.id === id))
                    .filter((t): t is NonNullable<typeof t> => !!t)
                    .map((t) => (
                      <ThemeChip key={t.id} theme={t} />
                    ))}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function compareLessonNumbers(a: string, b: string): number {
  const pa = parseNumber(a);
  const pb = parseNumber(b);
  if (pa.year !== pb.year) return pa.year - pb.year;
  return pa.index - pb.index;
}

function parseNumber(n: string): { year: number; index: number } {
  const m = n.match(/(\d+)[^0-9]+(\d+)/);
  if (!m) return { year: 0, index: 0 };
  return { year: Number(m[1]), index: Number(m[2]) };
}
