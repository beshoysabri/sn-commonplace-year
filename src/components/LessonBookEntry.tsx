import { forwardRef } from 'react';
import type {
  CommonplaceYear,
  Lesson,
  Source,
} from '../types/commonplace';
import { PriorityToggle } from './shared/PriorityToggle';
import { DatePill } from './shared/DatePill';
import { ThemeChip } from './shared/ThemeChip';
import {
  fragmentsWithAttributions,
  hasPerFragmentAttribution,
} from '../lib/fragments';

interface LessonBookEntryProps {
  lesson: Lesson;
  data: CommonplaceYear;
  showNumbers: boolean;
  focused: boolean;
  onTogglePriority: () => void;
  onOpen: () => void;
  onFocus: () => void;
}

/**
 * Typographic representation of a lesson inside Book view. Single column,
 * serif body, sans-serif chrome. Gold margin rule when important.
 */
export const LessonBookEntry = forwardRef<HTMLElement, LessonBookEntryProps>(
  function LessonBookEntry(
    { lesson, data, showNumbers, focused, onTogglePriority, onOpen, onFocus },
    ref,
  ) {
    const sources: Source[] = lesson.sourceIds
      .map((id) => data.sources.find((s) => s.id === id))
      .filter((s): s is Source => !!s);
    const themes = lesson.themeIds
      .map((id) => data.themes.find((t) => t.id === id))
      .filter((t): t is NonNullable<typeof t> => !!t);

    const references = lesson.referenceIds
      .map((id) => data.references.find((r) => r.id === id))
      .filter((r): r is NonNullable<typeof r> => !!r);

    const fragmentPairs = fragmentsWithAttributions(lesson, data);
    const hasPerFragment = hasPerFragmentAttribution(lesson);

    return (
      <article
        ref={ref}
        className={`cp-book-entry ${lesson.important ? 'important' : ''} ${focused ? 'focused' : ''}`}
        tabIndex={0}
        role="article"
        aria-label={`Lesson ${lesson.number}`}
        onClick={onOpen}
        onFocus={onFocus}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        {showNumbers && (
          <aside className="cp-book-gutter" aria-hidden="true">
            <span className="cp-book-num">{lesson.number}</span>
          </aside>
        )}

        <div className="cp-book-actions">
          <PriorityToggle
            important={lesson.important}
            onToggle={onTogglePriority}
            size={16}
          />
        </div>

        {lesson.title && <h2 className="cp-book-title">{lesson.title}</h2>}

        {lesson.originalText && (
          <div className="cp-book-original">
            <p className="cp-book-original-text" lang={lesson.originalLanguage}>
              {lesson.originalText}
            </p>
            {lesson.originalLanguage && (
              <span className="cp-book-original-lang">
                {lesson.originalLanguage}
              </span>
            )}
          </div>
        )}

        <div className="cp-book-body">
          {fragmentPairs.map(({ text, sources: fragSources }, idx) => (
            <p key={idx} className="cp-book-paragraph">
              {text}
              {hasPerFragment && fragSources.length > 0 && (
                <span className="cp-book-fragment-attribution">
                  {' — '}
                  {fragSources
                    .map((s) => s.name)
                    .reduce<React.ReactNode[]>((acc, name, i) => {
                      if (i > 0) acc.push(<span key={`fs-${i}`}>{', '}</span>);
                      acc.push(<span key={`fn-${i}`}>{name}</span>);
                      return acc;
                    }, [])}
                </span>
              )}
            </p>
          ))}
        </div>

        {lesson.reflection && (
          <aside className="cp-book-reflection">
            <span className="cp-book-reflection-label">— Reflection</span>
            <p className="cp-book-reflection-text">{lesson.reflection}</p>
          </aside>
        )}

        <footer className="cp-book-footer">
          {lesson.date && (
            <span className="cp-book-date">
              <DatePill date={lesson.date} withWeekday />
            </span>
          )}
          {themes.length > 0 && (
            <span className="cp-book-themes">
              {themes.map((t) => (
                <ThemeChip key={t.id} theme={t} />
              ))}
            </span>
          )}
          {references.length > 0 && (
            <span className="cp-book-reference">
              from{' '}
              {references.reduce<React.ReactNode[]>((acc, r, i) => {
                if (i > 0) acc.push(<span key={`sep-${i}`}> · </span>);
                acc.push(
                  <span key={r.id}>
                    <em>{r.title}</em>
                    {r.author && <span>, {r.author}</span>}
                  </span>,
                );
                return acc;
              }, [])}
            </span>
          )}
          {sources.length > 0 && !hasPerFragment && (
            <span className="cp-book-attribution">
              —{' '}
              {sources
                .map((s) => s.name)
                .reduce<React.ReactNode[]>((acc, name, i) => {
                  if (i > 0) acc.push(<span key={`sep-${i}`}> / </span>);
                  acc.push(<span key={`n-${i}`}>{name}</span>);
                  return acc;
                }, [])}
            </span>
          )}
        </footer>
      </article>
    );
  },
);

