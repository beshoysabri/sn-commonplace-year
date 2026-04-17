import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CommonplaceYear, Lesson } from '../../types/commonplace';
import { ChapterOpener } from '../ChapterOpener';
import { LessonBookEntry } from '../LessonBookEntry';
import { EmptyState } from '../shared/EmptyState';
import { BookOpenIcon } from '../../lib/icons';

interface BookViewProps {
  data: CommonplaceYear;
  onChange: (next: CommonplaceYear) => void;
  onOpenLesson: (lesson: Lesson) => void;
  paperMode: boolean;
  showImportantOnly: boolean;
  searchQuery?: string;
}

export function BookView({
  data,
  onChange,
  onOpenLesson,
  paperMode,
  showImportantOnly,
  searchQuery = '',
}: BookViewProps) {
  const lessons = useMemo(() => {
    let ls = data.lessons;
    if (showImportantOnly) {
      ls = ls.filter((l) => l.important);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      ls = ls.filter((l) => {
        const hay = [l.title, l.body, l.reflection, l.number]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return ls;
  }, [data.lessons, showImportantOnly, searchQuery]);

  const [focusIndex, setFocusIndex] = useState<number>(-1);
  const entryRefs = useRef<(HTMLElement | null)[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const togglePriority = useCallback(
    (lessonId: string) => {
      onChange({
        ...data,
        lessons: data.lessons.map((l) =>
          l.id === lessonId
            ? { ...l, important: !l.important, updatedAt: new Date().toISOString() }
            : l,
        ),
      });
    },
    [data, onChange],
  );

  // Scroll focused lesson into view.
  useEffect(() => {
    if (focusIndex < 0) return;
    const el = entryRefs.current[focusIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    }
  }, [focusIndex]);

  // Keyboard navigation: j/k/f/space. Skip when user is typing in an input.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          setFocusIndex((i) => Math.min(i + 1, lessons.length - 1));
          break;
        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          setFocusIndex((i) => Math.max(i - 1, 0));
          break;
        case ' ': {
          const currentFocus = focusIndex;
          if (currentFocus >= 0 && lessons[currentFocus]) {
            e.preventDefault();
            onOpenLesson(lessons[currentFocus]);
          }
          break;
        }
        case 'f': {
          const currentFocus = focusIndex;
          if (currentFocus >= 0 && lessons[currentFocus]) {
            e.preventDefault();
            togglePriority(lessons[currentFocus].id);
          }
          break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusIndex, lessons, onOpenLesson, togglePriority]);

  return (
    <div
      className={`cp-book-view ${paperMode ? 'cp-paper-mode' : ''}`}
      ref={wrapRef}
    >
      <div className="cp-book-column">
        <ChapterOpener data={data} />

        {lessons.length === 0 && (
          <EmptyState
            icon={<BookOpenIcon size={36} />}
            title={
              showImportantOnly
                ? 'No important lessons yet'
                : searchQuery
                  ? 'No matches for that search'
                  : 'A blank page'
            }
            description={
              showImportantOnly
                ? 'Flag any lesson as important to see it here.'
                : searchQuery
                  ? 'Try different words, or clear the search.'
                  : 'Press n to write your first lesson of the year.'
            }
          />
        )}

        {lessons.map((l, idx) => (
          <LessonBookEntry
            key={l.id}
            ref={(el) => {
              entryRefs.current[idx] = el;
            }}
            lesson={l}
            data={data}
            showNumbers={data.settings.showNumbersInBookView}
            focused={focusIndex === idx}
            onTogglePriority={() => togglePriority(l.id)}
            onOpen={() => onOpenLesson(l)}
            onFocus={() => setFocusIndex(idx)}
          />
        ))}
      </div>
    </div>
  );
}
