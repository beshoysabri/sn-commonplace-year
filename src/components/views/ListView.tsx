import { useMemo, useState } from 'react';
import type { CommonplaceYear, Lesson } from '../../types/commonplace';
import { PriorityToggle } from '../shared/PriorityToggle';
import { LessonNumberBadge } from '../shared/LessonNumberBadge';
import { DatePill } from '../shared/DatePill';
import { SourceChip } from '../shared/SourceChip';
import { ThemeChip } from '../shared/ThemeChip';
import { EmptyState } from '../shared/EmptyState';
import { BookOpenIcon, StarFilledIcon, TagIcon, TrashIcon } from '../../lib/icons';
import { MONTHS_LONG, parseLocalDate } from '../../lib/dates';
import { filterLessons } from '../../lib/search';

type SortKey = 'number' | 'date' | 'important' | 'source' | 'theme';
type GroupKey = 'none' | 'month' | 'priority' | 'theme';

interface ListViewProps {
  data: CommonplaceYear;
  onChange: (next: CommonplaceYear) => void;
  onOpenLesson: (lesson: Lesson) => void;
  showImportantOnly: boolean;
  searchQuery: string;
}

export function ListView({
  data,
  onChange,
  onOpenLesson,
  showImportantOnly,
  searchQuery,
}: ListViewProps) {
  const [sort, setSort] = useState<SortKey>('number');
  const [group, setGroup] = useState<GroupKey>('none');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastClicked, setLastClicked] = useState<string | null>(null);

  const sourceById = useMemo(
    () => new Map(data.sources.map((s) => [s.id, s])),
    [data.sources],
  );
  const themeById = useMemo(
    () => new Map(data.themes.map((t) => [t.id, t])),
    [data.themes],
  );

  const filtered = useMemo(() => {
    let ls = filterLessons(data.lessons, data, searchQuery);
    if (showImportantOnly) ls = ls.filter((l) => l.important);
    return ls;
  }, [data, searchQuery, showImportantOnly]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case 'number':
        // numeric-aware sort: YY#N
        arr.sort((a, b) => compareLessonNumbers(a.number, b.number));
        break;
      case 'date':
        arr.sort((a, b) => {
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return a.date.localeCompare(b.date);
        });
        break;
      case 'important':
        arr.sort((a, b) => Number(b.important) - Number(a.important));
        break;
      case 'source':
        arr.sort((a, b) => {
          const na = sourceById.get(a.sourceIds[0] ?? '')?.name ?? '';
          const nb = sourceById.get(b.sourceIds[0] ?? '')?.name ?? '';
          return na.localeCompare(nb);
        });
        break;
      case 'theme':
        arr.sort((a, b) => {
          const na = themeById.get(a.themeIds[0] ?? '')?.name ?? '';
          const nb = themeById.get(b.themeIds[0] ?? '')?.name ?? '';
          return na.localeCompare(nb);
        });
        break;
    }
    return arr;
  }, [filtered, sort, sourceById, themeById]);

  const groups = useMemo<Array<{ title: string; items: Lesson[] }>>(() => {
    if (group === 'none') {
      return [{ title: '', items: sorted }];
    }
    const buckets = new Map<string, Lesson[]>();
    for (const l of sorted) {
      const key = groupKey(l, group, themeById);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(l);
    }
    return [...buckets.entries()].map(([title, items]) => ({ title, items }));
  }, [sorted, group, themeById]);

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

  const handleRowClick = (l: Lesson, e: React.MouseEvent) => {
    if (e.shiftKey && lastClicked) {
      // Shift-click: select range from lastClicked to l
      const ids = sorted.map((x) => x.id);
      const a = ids.indexOf(lastClicked);
      const b = ids.indexOf(l.id);
      if (a >= 0 && b >= 0) {
        const [from, to] = a <= b ? [a, b] : [b, a];
        const next = new Set(selected);
        for (let i = from; i <= to; i++) next.add(ids[i]);
        setSelected(next);
      }
      return;
    }
    if (e.metaKey || e.ctrlKey) {
      const next = new Set(selected);
      if (next.has(l.id)) next.delete(l.id);
      else next.add(l.id);
      setSelected(next);
      setLastClicked(l.id);
      return;
    }
    onOpenLesson(l);
  };

  const bulkMarkImportant = (flag: boolean) => {
    onChange({
      ...data,
      lessons: data.lessons.map((l) =>
        selected.has(l.id)
          ? { ...l, important: flag, updatedAt: new Date().toISOString() }
          : l,
      ),
    });
  };

  const bulkDelete = () => {
    onChange({
      ...data,
      lessons: data.lessons.filter((l) => !selected.has(l.id)),
    });
    setSelected(new Set());
  };

  const clearSelection = () => setSelected(new Set());

  return (
    <div className="cp-list-view">
      <div className="cp-list-toolbar">
        <label className="cp-list-sort">
          <span>Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="important">Important first</option>
            <option value="source">Source</option>
            <option value="theme">Theme</option>
          </select>
        </label>
        <label className="cp-list-sort">
          <span>Group by</span>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value as GroupKey)}
          >
            <option value="none">None</option>
            <option value="month">Month</option>
            <option value="priority">Priority</option>
            <option value="theme">Theme</option>
          </select>
        </label>
        {selected.size > 0 && (
          <div className="cp-list-bulk">
            <span className="cp-list-bulk-count">{selected.size} selected</span>
            <button
              type="button"
              className="cp-btn cp-btn-ghost cp-btn-icon"
              onClick={() => bulkMarkImportant(true)}
              title="Mark important"
            >
              <StarFilledIcon size={12} /> Mark important
            </button>
            <button
              type="button"
              className="cp-btn cp-btn-ghost cp-btn-icon"
              onClick={() => bulkMarkImportant(false)}
              title="Unmark"
            >
              <TagIcon size={12} /> Unmark
            </button>
            <button
              type="button"
              className="cp-btn cp-btn-ghost cp-btn-icon"
              onClick={bulkDelete}
              title="Delete"
            >
              <TrashIcon size={12} /> Delete
            </button>
            <button
              type="button"
              className="cp-btn cp-btn-ghost cp-btn-icon"
              onClick={clearSelection}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={<BookOpenIcon size={32} />}
          title={
            showImportantOnly
              ? 'No important lessons yet'
              : searchQuery
                ? 'No matches'
                : 'No lessons yet'
          }
          description={
            showImportantOnly
              ? 'Flag a lesson as important to see it here.'
              : searchQuery
                ? 'Try different words.'
                : 'Press n to write your first lesson.'
          }
        />
      ) : (
        groups.map((g) => (
          <div key={g.title || 'flat'} className="cp-list-group">
            {g.title && <h3 className="cp-list-group-title">{g.title}</h3>}
            <ul className="cp-list">
              {g.items.map((l) => {
                const sources = l.sourceIds
                  .map((id) => sourceById.get(id))
                  .filter((s): s is NonNullable<typeof s> => !!s);
                const themes = l.themeIds
                  .map((id) => themeById.get(id))
                  .filter((t): t is NonNullable<typeof t> => !!t);
                const isSelected = selected.has(l.id);
                return (
                  <li
                    key={l.id}
                    className={`cp-list-row ${isSelected ? 'selected' : ''} ${l.important ? 'important' : ''}`}
                    onClick={(e) => handleRowClick(l, e)}
                  >
                    <LessonNumberBadge number={l.number} />
                    <div className="cp-list-title">
                      {l.title ?? l.body.replace(/\s+/g, ' ').trim()}
                    </div>
                    <div className="cp-list-meta">
                      {l.date && <DatePill date={l.date} />}
                      {sources.slice(0, 3).map((s) => (
                        <SourceChip key={s.id} source={s} />
                      ))}
                      {sources.length > 3 && (
                        <span className="cp-list-more">+{sources.length - 3}</span>
                      )}
                      {themes.slice(0, 2).map((t) => (
                        <ThemeChip key={t.id} theme={t} />
                      ))}
                    </div>
                    <PriorityToggle
                      important={l.important}
                      onToggle={() => togglePriority(l.id)}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

function compareLessonNumbers(a: string, b: string): number {
  const ma = parseNumber(a);
  const mb = parseNumber(b);
  if (ma.year !== mb.year) return ma.year - mb.year;
  return ma.index - mb.index;
}

function parseNumber(n: string): { year: number; index: number } {
  const match = n.match(/(\d+)[^0-9]+(\d+)/);
  if (!match) return { year: 0, index: 0 };
  return { year: Number(match[1]), index: Number(match[2]) };
}

function groupKey(
  l: Lesson,
  group: GroupKey,
  themeById: Map<string, { name: string } | undefined>,
): string {
  switch (group) {
    case 'month':
      if (!l.date) return 'No date';
      return MONTHS_LONG[parseLocalDate(l.date).getMonth()] ?? 'No date';
    case 'priority':
      return l.important ? 'Important' : 'Other';
    case 'theme':
      if (l.themeIds.length === 0) return 'Untagged';
      return themeById.get(l.themeIds[0])?.name ?? 'Untagged';
    default:
      return '';
  }
}
