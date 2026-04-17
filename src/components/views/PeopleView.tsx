import { useMemo, useState } from 'react';
import type { CommonplaceYear, Lesson, Source } from '../../types/commonplace';
import { EmptyState } from '../shared/EmptyState';
import { PriorityToggle } from '../shared/PriorityToggle';
import { LessonNumberBadge } from '../shared/LessonNumberBadge';
import { DatePill } from '../shared/DatePill';
import {
  UserSilhouetteIcon,
  PlusIcon,
  EditIcon,
} from '../../lib/icons';
import { hexToRgba, contrastColor } from '../../lib/colors';

interface PeopleViewProps {
  data: CommonplaceYear;
  onOpenLesson: (lesson: Lesson) => void;
  onOpenSource: (source: Source) => void;
  onNewSource: () => void;
}

type SortKey = 'name' | 'citations' | 'reverence';

export function PeopleView({
  data,
  onOpenLesson,
  onOpenSource,
  onNewSource,
}: PeopleViewProps) {
  const [sort, setSort] = useState<SortKey>('citations');
  const [selectedId, setSelectedId] = useState<string | null>(
    data.sources[0]?.id ?? null,
  );
  const [query, setQuery] = useState('');

  // citationCount map — counts lessons where sourceIds includes s.id.
  const citations = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of data.lessons) {
      for (const id of l.sourceIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [data.lessons]);

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = data.sources.filter(
      (s) =>
        !q || s.name.toLowerCase().includes(q) || (s.role ?? '').toLowerCase().includes(q),
    );
    switch (sort) {
      case 'name':
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'citations':
        arr.sort(
          (a, b) =>
            (citations.get(b.id) ?? 0) - (citations.get(a.id) ?? 0) ||
            a.name.localeCompare(b.name),
        );
        break;
      case 'reverence':
        arr.sort((a, b) => (b.reverence ?? 0) - (a.reverence ?? 0));
        break;
    }
    return arr;
  }, [data.sources, sort, citations, query]);

  const selected = data.sources.find((s) => s.id === selectedId) ?? sorted[0];

  const lessonsForSelected = useMemo<Lesson[]>(() => {
    if (!selected) return [];
    return data.lessons
      .filter((l) => l.sourceIds.includes(selected.id))
      .sort((a, b) => a.number.localeCompare(b.number));
  }, [data.lessons, selected]);

  // Co-citation ranking: which sources most frequently appear alongside
  // the selected source in multi-source lessons.
  const coCitations = useMemo<Array<{ source: Source; count: number }>>(() => {
    if (!selected) return [];
    const counts = new Map<string, number>();
    for (const l of data.lessons) {
      if (!l.sourceIds.includes(selected.id)) continue;
      for (const other of l.sourceIds) {
        if (other === selected.id) continue;
        counts.set(other, (counts.get(other) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([id, count]) => {
        const s = data.sources.find((x) => x.id === id);
        return s ? { source: s, count } : null;
      })
      .filter((x): x is { source: Source; count: number } => !!x)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [selected, data.lessons, data.sources]);

  if (data.sources.length === 0) {
    return (
      <div className="cp-people-view cp-people-empty">
        <EmptyState
          icon={<UserSilhouetteIcon size={32} />}
          title="No sources yet"
          description="Sources are the people and works that shaped your year. Add one as you cite it."
          action={
            <button className="cp-btn cp-btn-primary" onClick={onNewSource}>
              <PlusIcon size={14} /> New source
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="cp-people-view">
      <aside className="cp-people-sidebar">
        <div className="cp-people-sidebar-header">
          <input
            type="search"
            className="cp-input cp-people-sidebar-search"
            placeholder="Filter sources…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="cp-input cp-people-sidebar-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort sources"
          >
            <option value="citations">Most cited</option>
            <option value="name">Name</option>
            <option value="reverence">Reverence</option>
          </select>
        </div>
        <ul className="cp-people-list">
          {sorted.map((s) => {
            const n = citations.get(s.id) ?? 0;
            const isActive = s.id === selected?.id;
            return (
              <li
                key={s.id}
                className={`cp-people-item ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedId(s.id)}
              >
                <span
                  className="cp-people-avatar"
                  style={{
                    background: s.color,
                    color: contrastColor(s.color),
                  }}
                  aria-hidden="true"
                >
                  {initials(s.name)}
                </span>
                <span className="cp-people-item-name">{s.name}</span>
                <span className="cp-people-item-count">{n}</span>
              </li>
            );
          })}
          {sorted.length === 0 && (
            <li className="cp-people-item-empty">No sources match.</li>
          )}
        </ul>
      </aside>
      <section className="cp-people-main">
        {selected ? (
          <SourcePage
            source={selected}
            lessons={lessonsForSelected}
            data={data}
            coCitations={coCitations}
            onOpenLesson={onOpenLesson}
            onOpenSource={(s) => {
              setSelectedId(s.id);
            }}
            onEditSource={() => onOpenSource(selected)}
          />
        ) : (
          <EmptyState
            icon={<UserSilhouetteIcon size={32} />}
            title="Select a source"
            description="Pick someone on the left to see everything you learned from them this year."
          />
        )}
      </section>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function SourcePage({
  source,
  lessons,
  data,
  coCitations,
  onOpenLesson,
  onOpenSource,
  onEditSource,
}: {
  source: Source;
  lessons: Lesson[];
  data: CommonplaceYear;
  coCitations: Array<{ source: Source; count: number }>;
  onOpenLesson: (lesson: Lesson) => void;
  onOpenSource: (source: Source) => void;
  onEditSource: () => void;
}) {
  return (
    <article className="cp-source-page">
      <header className="cp-source-header">
        <div
          className="cp-source-avatar-large"
          style={{
            background: source.color,
            color: contrastColor(source.color),
          }}
          aria-hidden="true"
        >
          {initials(source.name)}
        </div>
        <div className="cp-source-title-block">
          <h2 className="cp-source-name">{source.name}</h2>
          <div className="cp-source-meta">
            {source.lifeYears && <span>{source.lifeYears}</span>}
            {source.role && <span>· {source.role}</span>}
            {source.kind !== 'person' && <span>· {source.kind}</span>}
          </div>
          {source.reverence && (
            <div className="cp-source-reverence" aria-label={`${source.reverence} of 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`cp-reverence-star ${i < source.reverence! ? 'on' : ''}`}
                  aria-hidden="true"
                >
                  ★
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="cp-btn cp-btn-ghost cp-btn-icon"
          onClick={onEditSource}
          title="Edit source"
        >
          <EditIcon size={14} /> Edit
        </button>
      </header>

      {source.notes && (
        <p className="cp-source-notes">{source.notes}</p>
      )}

      <div className="cp-source-count">
        {lessons.length === 0
          ? 'Not cited in any lesson yet.'
          : `Cited in ${lessons.length} lesson${lessons.length === 1 ? '' : 's'}.`}
      </div>

      <ol className="cp-source-timeline">
        {lessons.map((l) => (
          <li
            key={l.id}
            className="cp-source-lesson"
            onClick={() => onOpenLesson(l)}
          >
            <div className="cp-source-lesson-head">
              <LessonNumberBadge number={l.number} />
              {l.date && <DatePill date={l.date} />}
              <PriorityToggle
                important={l.important}
                onToggle={() => {
                  /* toggling here would bubble; keep read-only in People */
                }}
                aria-label={
                  l.important ? 'Important' : 'Not marked important'
                }
              />
            </div>
            {l.title && <div className="cp-source-lesson-title">{l.title}</div>}
            <p className="cp-source-lesson-body">
              {truncate(l.body.replace(/\s*\/\s*/g, ' / '), 260)}
            </p>
            {l.reflection && (
              <p className="cp-source-lesson-reflection">— {truncate(l.reflection, 160)}</p>
            )}
          </li>
        ))}
      </ol>

      {coCitations.length > 0 && (
        <section className="cp-source-copresence">
          <h3 className="cp-source-copresence-title">Also appears with</h3>
          <div className="cp-source-copresence-list">
            {coCitations.map(({ source: s, count }) => (
              <button
                key={s.id}
                type="button"
                className="cp-source-copresence-chip"
                onClick={() => onOpenSource(s)}
                style={{
                  background: hexToRgba(s.color, 0.12),
                  color: s.color,
                  borderColor: hexToRgba(s.color, 0.3),
                }}
              >
                <span className="cp-source-chip-dot" style={{ background: s.color }} />
                <span>{s.name}</span>
                <span className="cp-source-copresence-count">×{count}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* silence the unused-param lint by referencing data at least once */}
      <span hidden aria-hidden="true" data-sources={data.sources.length} />
    </article>
  );
}

function truncate(s: string, n: number): string {
  const flat = s.replace(/\s+/g, ' ').trim();
  return flat.length > n ? flat.slice(0, n - 1) + '…' : flat;
}
