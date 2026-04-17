import { useMemo, useState } from 'react';
import type { CommonplaceYear, Lesson, Theme } from '../../types/commonplace';
import { EmptyState } from '../shared/EmptyState';
import { LessonNumberBadge } from '../shared/LessonNumberBadge';
import { PriorityToggle } from '../shared/PriorityToggle';
import { TagIcon, PlusIcon, EditIcon } from '../../lib/icons';
import { hexToRgba } from '../../lib/colors';

interface ThemesViewProps {
  data: CommonplaceYear;
  onOpenLesson: (lesson: Lesson) => void;
  onOpenTheme: (theme: Theme) => void;
  onNewTheme: () => void;
}

const UNTAGGED_KEY = '__untagged__';

export function ThemesView({
  data,
  onOpenLesson,
  onOpenTheme,
  onNewTheme,
}: ThemesViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const lessonsByTheme = useMemo(() => {
    const m = new Map<string, Lesson[]>();
    for (const l of data.lessons) {
      if (l.themeIds.length === 0) {
        if (!m.has(UNTAGGED_KEY)) m.set(UNTAGGED_KEY, []);
        m.get(UNTAGGED_KEY)!.push(l);
      } else {
        for (const t of l.themeIds) {
          if (!m.has(t)) m.set(t, []);
          m.get(t)!.push(l);
        }
      }
    }
    return m;
  }, [data.lessons]);

  const sortedThemes = useMemo(() => {
    return [...data.themes].sort(
      (a, b) =>
        (lessonsByTheme.get(b.id)?.length ?? 0) -
          (lessonsByTheme.get(a.id)?.length ?? 0) ||
        a.name.localeCompare(b.name),
    );
  }, [data.themes, lessonsByTheme]);

  if (data.themes.length === 0 && !lessonsByTheme.has(UNTAGGED_KEY)) {
    return (
      <div className="cp-themes-view cp-themes-empty">
        <EmptyState
          icon={<TagIcon size={32} />}
          title="No themes yet"
          description="Themes are the through-lines of your year. Tag lessons as you write."
          action={
            <button className="cp-btn cp-btn-primary" onClick={onNewTheme}>
              <PlusIcon size={14} /> New theme
            </button>
          }
        />
      </div>
    );
  }

  const untagged = lessonsByTheme.get(UNTAGGED_KEY);

  return (
    <div className="cp-themes-view">
      <div className="cp-themes-grid">
        {sortedThemes.map((t) => {
          const ls = lessonsByTheme.get(t.id) ?? [];
          const isOpen = expandedId === t.id;
          return (
            <article
              key={t.id}
              className={`cp-theme-card ${isOpen ? 'open' : ''}`}
              style={{ borderColor: hexToRgba(t.color, 0.35) }}
            >
              <div
                className="cp-theme-band"
                style={{ background: t.color }}
                aria-hidden="true"
              />
              <header
                className="cp-theme-card-head"
                onClick={() => setExpandedId(isOpen ? null : t.id)}
              >
                <div>
                  <h3 className="cp-theme-card-name" style={{ color: t.color }}>
                    {t.name}
                  </h3>
                  {t.description && (
                    <p className="cp-theme-card-desc">{t.description}</p>
                  )}
                </div>
                <div className="cp-theme-card-actions">
                  <span className="cp-theme-card-count">{ls.length}</span>
                  <button
                    type="button"
                    className="cp-btn cp-btn-ghost cp-btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTheme(t);
                    }}
                    aria-label="Edit theme"
                  >
                    <EditIcon size={12} />
                  </button>
                </div>
              </header>
              {isOpen && (
                <ThemeLessonList lessons={ls} onOpenLesson={onOpenLesson} />
              )}
            </article>
          );
        })}
        {untagged && untagged.length > 0 && (
          <article className="cp-theme-card cp-theme-card-untagged">
            <header
              className="cp-theme-card-head"
              onClick={() =>
                setExpandedId(
                  expandedId === UNTAGGED_KEY ? null : UNTAGGED_KEY,
                )
              }
            >
              <div>
                <h3 className="cp-theme-card-name cp-theme-card-untagged-name">
                  Untagged
                </h3>
                <p className="cp-theme-card-desc">
                  Lessons without a theme. Your end-of-year review list.
                </p>
              </div>
              <span className="cp-theme-card-count">{untagged.length}</span>
            </header>
            {expandedId === UNTAGGED_KEY && (
              <ThemeLessonList lessons={untagged} onOpenLesson={onOpenLesson} />
            )}
          </article>
        )}
      </div>
    </div>
  );
}

function ThemeLessonList({
  lessons,
  onOpenLesson,
}: {
  lessons: Lesson[];
  onOpenLesson: (lesson: Lesson) => void;
}) {
  return (
    <ul className="cp-theme-lessons">
      {lessons.map((l) => (
        <li
          key={l.id}
          className="cp-theme-lesson"
          onClick={() => onOpenLesson(l)}
        >
          <LessonNumberBadge number={l.number} />
          <span className="cp-theme-lesson-body">
            {truncate(l.title ?? l.body, 180)}
          </span>
          <PriorityToggle
            important={l.important}
            onToggle={() => {
              /* viewing only — edits happen in the lesson modal */
            }}
            aria-label={l.important ? 'Important' : 'Not important'}
          />
        </li>
      ))}
    </ul>
  );
}

function truncate(s: string, n: number): string {
  const flat = s.replace(/\s+/g, ' ').trim();
  return flat.length > n ? flat.slice(0, n - 1) + '…' : flat;
}
