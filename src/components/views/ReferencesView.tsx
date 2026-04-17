import { useMemo, useState } from 'react';
import type {
  CommonplaceYear,
  Lesson,
  Reference,
  ReferenceKind,
} from '../../types/commonplace';
import { REFERENCE_KINDS } from '../../types/commonplace';
import { EmptyState } from '../shared/EmptyState';
import { LessonNumberBadge } from '../shared/LessonNumberBadge';
import {
  BookmarkIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  EditIcon,
} from '../../lib/icons';

interface ReferencesViewProps {
  data: CommonplaceYear;
  onOpenLesson: (lesson: Lesson) => void;
  onOpenReference: (reference: Reference) => void;
  onNewReference: () => void;
}

type SortKey = 'author' | 'year' | 'status' | 'rating' | 'lessons';

export function ReferencesView({
  data,
  onOpenLesson,
  onOpenReference,
  onNewReference,
}: ReferencesViewProps) {
  const [sort, setSort] = useState<SortKey>('author');
  const [filterKind, setFilterKind] = useState<ReferenceKind | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const lessonsByReference = useMemo(() => {
    const m = new Map<string, Lesson[]>();
    for (const l of data.lessons) {
      if (!l.referenceId) continue;
      if (!m.has(l.referenceId)) m.set(l.referenceId, []);
      m.get(l.referenceId)!.push(l);
    }
    return m;
  }, [data.lessons]);

  const sorted = useMemo(() => {
    const arr = data.references.filter(
      (r) => filterKind === 'all' || r.kind === filterKind,
    );
    switch (sort) {
      case 'author':
        arr.sort((a, b) => (a.author ?? '').localeCompare(b.author ?? ''));
        break;
      case 'year':
        arr.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
        break;
      case 'status':
        arr.sort((a, b) => (a.status ?? '').localeCompare(b.status ?? ''));
        break;
      case 'rating':
        arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'lessons':
        arr.sort(
          (a, b) =>
            (lessonsByReference.get(b.id)?.length ?? 0) -
            (lessonsByReference.get(a.id)?.length ?? 0),
        );
        break;
    }
    return arr;
  }, [data.references, sort, filterKind, lessonsByReference]);

  if (data.references.length === 0) {
    return (
      <div className="cp-references-view cp-references-empty">
        <EmptyState
          icon={<BookmarkIcon size={32} />}
          title="No references yet"
          description="Add books, articles, lectures, and conversations as you draw from them."
          action={
            <button className="cp-btn cp-btn-primary" onClick={onNewReference}>
              <PlusIcon size={14} /> New reference
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="cp-references-view">
      <div className="cp-list-toolbar">
        <label className="cp-list-sort">
          <span>Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="author">Author</option>
            <option value="year">Year</option>
            <option value="status">Status</option>
            <option value="rating">Rating</option>
            <option value="lessons">Lessons</option>
          </select>
        </label>
        <label className="cp-list-sort">
          <span>Kind</span>
          <select
            value={filterKind}
            onChange={(e) =>
              setFilterKind(e.target.value as ReferenceKind | 'all')
            }
          >
            <option value="all">All</option>
            {REFERENCE_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="cp-references-list">
        {sorted.map((r) => {
          const ls = lessonsByReference.get(r.id) ?? [];
          const isOpen = expandedId === r.id;
          return (
            <li key={r.id} className="cp-reference-row">
              <div
                className="cp-reference-head"
                onClick={() =>
                  setExpandedId(isOpen ? null : r.id)
                }
              >
                <span className="cp-reference-chev">
                  {isOpen ? (
                    <ChevronDownIcon size={12} />
                  ) : (
                    <ChevronRightIcon size={12} />
                  )}
                </span>
                {r.coverUrl ? (
                  <img
                    src={r.coverUrl}
                    alt=""
                    className="cp-reference-cover"
                    aria-hidden="true"
                    loading="lazy"
                  />
                ) : (
                  <span className="cp-reference-cover cp-reference-cover-blank" />
                )}
                <div className="cp-reference-titles">
                  <div className="cp-reference-title">{r.title}</div>
                  <div className="cp-reference-meta">
                    {r.author && <span>{r.author}</span>}
                    {r.year && <span>· {r.year}</span>}
                    <span>· {r.kind}</span>
                    {r.status && (
                      <span className={`cp-reference-status cp-reference-status-${r.status}`}>
                        {r.status}
                      </span>
                    )}
                    {r.rating && (
                      <span className="cp-reference-rating">
                        {'★'.repeat(r.rating)}
                        <span className="cp-reference-rating-empty">
                          {'★'.repeat(5 - r.rating)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <span className="cp-reference-count">
                  {ls.length} lesson{ls.length === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  className="cp-btn cp-btn-ghost cp-btn-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenReference(r);
                  }}
                  aria-label="Edit reference"
                >
                  <EditIcon size={12} />
                </button>
              </div>
              {isOpen && (
                <div className="cp-reference-body">
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cp-reference-link"
                    >
                      {r.url}
                    </a>
                  )}
                  {r.notes && (
                    <p className="cp-reference-notes">{r.notes}</p>
                  )}
                  {ls.length === 0 ? (
                    <p className="cp-reference-empty">
                      No lessons link to this reference yet.
                    </p>
                  ) : (
                    <ul className="cp-reference-lessons">
                      {ls.map((l) => (
                        <li
                          key={l.id}
                          className="cp-reference-lesson"
                          onClick={() => onOpenLesson(l)}
                        >
                          <LessonNumberBadge number={l.number} />
                          <span className="cp-reference-lesson-body">
                            {truncate(l.title ?? l.body, 180)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function truncate(s: string, n: number): string {
  const flat = s.replace(/\s+/g, ' ').trim();
  return flat.length > n ? flat.slice(0, n - 1) + '…' : flat;
}
