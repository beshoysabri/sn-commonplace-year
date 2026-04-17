import { useMemo, useState } from 'react';
import type { CommonplaceYear, ISODate, Lesson } from '../../types/commonplace';
import { EmptyState } from '../shared/EmptyState';
import { LessonNumberBadge } from '../shared/LessonNumberBadge';
import { PriorityToggle } from '../shared/PriorityToggle';
import { DatePill } from '../shared/DatePill';
import { CalendarIcon } from '../../lib/icons';
import { MONTHS_LONG, WEEKDAYS_SHORT, todayIso } from '../../lib/dates';
import {
  densestWeek,
  groupLessonsByDate,
  isoDateFor,
  monthGrid,
} from '../../lib/calendar';

interface CalendarViewProps {
  data: CommonplaceYear;
  onOpenLesson: (lesson: Lesson) => void;
  showImportantOnly: boolean;
  searchQuery: string;
}

export function CalendarView({
  data,
  onOpenLesson,
  showImportantOnly,
  searchQuery,
}: CalendarViewProps) {
  const [activeDate, setActiveDate] = useState<ISODate | null>(null);

  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.lessons.filter((l) => {
      if (showImportantOnly && !l.important) return false;
      if (!q) return true;
      const hay = [l.title, l.body, l.reflection, l.number]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data.lessons, showImportantOnly, searchQuery]);

  const byDate = useMemo(() => groupLessonsByDate(visible), [visible]);
  const datedLessonCount = useMemo(
    () => visible.filter((l) => !!l.date).length,
    [visible],
  );
  const undated = useMemo(() => visible.filter((l) => !l.date), [visible]);
  const densest = useMemo(() => densestWeek(visible), [visible]);
  const today = todayIso();

  const maxLessonsPerDay = useMemo(() => {
    let max = 0;
    for (const list of byDate.values()) {
      if (list.length > max) max = list.length;
    }
    return Math.max(max, 1);
  }, [byDate]);

  return (
    <div className="cp-calendar-view">
      <div className="cp-calendar-summary">
        <span>
          <strong>{datedLessonCount}</strong> of{' '}
          <strong>{visible.length}</strong> lessons have dates
        </span>
        {densest && (
          <span>
            · Densest week: week {densest.week} ({densest.count} lesson
            {densest.count === 1 ? '' : 's'})
          </span>
        )}
      </div>

      <div className="cp-calendar-grid">
        {Array.from({ length: 12 }, (_, m) => (
          <MonthCell
            key={m}
            year={data.year}
            month={m}
            byDate={byDate}
            today={today}
            maxLessonsPerDay={maxLessonsPerDay}
            activeDate={activeDate}
            onClickDay={(iso) =>
              setActiveDate(activeDate === iso ? null : iso)
            }
          />
        ))}
      </div>

      {activeDate && byDate.has(activeDate) && (
        <div className="cp-calendar-popover-list">
          <h3 className="cp-calendar-popover-title">
            <DatePill date={activeDate} withWeekday />
          </h3>
          <ul className="cp-calendar-popover-lessons">
            {byDate.get(activeDate)!.map((l) => (
              <li
                key={l.id}
                className="cp-calendar-popover-lesson"
                onClick={() => onOpenLesson(l)}
              >
                <LessonNumberBadge number={l.number} />
                <span className="cp-calendar-popover-body">
                  {l.title ?? truncate(l.body, 160)}
                </span>
                <PriorityToggle
                  important={l.important}
                  onToggle={() => {
                    /* view-only */
                  }}
                  aria-label={l.important ? 'Important' : 'Not important'}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="cp-calendar-undated">
        <h3 className="cp-calendar-undated-title">
          No date
          <span className="cp-calendar-undated-count">{undated.length}</span>
        </h3>
        {undated.length === 0 ? (
          <p className="cp-calendar-undated-empty">
            Every visible lesson carries a date.
          </p>
        ) : (
          <ul className="cp-calendar-popover-lessons">
            {undated.map((l) => (
              <li
                key={l.id}
                className="cp-calendar-popover-lesson"
                onClick={() => onOpenLesson(l)}
              >
                <LessonNumberBadge number={l.number} />
                <span className="cp-calendar-popover-body">
                  {l.title ?? truncate(l.body, 160)}
                </span>
                <PriorityToggle
                  important={l.important}
                  onToggle={() => {
                    /* view-only */
                  }}
                  aria-label={l.important ? 'Important' : 'Not important'}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {visible.length === 0 && (
        <EmptyState
          icon={<CalendarIcon size={32} />}
          title="No lessons yet"
          description="Dated lessons light up this calendar."
        />
      )}
    </div>
  );
}

interface MonthCellProps {
  year: number;
  month: number;
  byDate: Map<ISODate, Lesson[]>;
  today: ISODate;
  maxLessonsPerDay: number;
  activeDate: ISODate | null;
  onClickDay: (iso: ISODate) => void;
}

function MonthCell({
  year,
  month,
  byDate,
  today,
  maxLessonsPerDay,
  activeDate,
  onClickDay,
}: MonthCellProps) {
  const rows = monthGrid(year, month);
  const monthName = MONTHS_LONG[month];

  return (
    <div className="cp-month-cell">
      <header className="cp-month-header">{monthName}</header>
      <div className="cp-weekday-row" aria-hidden="true">
        {WEEKDAYS_SHORT.map((d) => (
          <span key={d} className="cp-weekday-name">
            {d[0]}
          </span>
        ))}
      </div>
      <div className="cp-month-grid">
        {rows.map((row, rIdx) =>
          row.map((day, cIdx) => {
            const key = `${rIdx}-${cIdx}`;
            if (day === null) return <div key={key} className="cp-day cp-day-empty" />;
            const iso = isoDateFor(year, month, day);
            const lessons = byDate.get(iso) ?? [];
            const n = lessons.length;
            const hasImportant = lessons.some((l) => l.important);
            const isToday = iso === today;
            const isActive = iso === activeDate;
            const intensity =
              n > 0 ? Math.min(1, n / maxLessonsPerDay) : 0;
            const title = lessons.length
              ? `${n} lesson${n === 1 ? '' : 's'}${lessons[0].title ? ' · ' + lessons[0].title : ''}`
              : undefined;
            return (
              <button
                key={key}
                type="button"
                className={`cp-day ${isToday ? 'today' : ''} ${isActive ? 'active' : ''} ${n > 0 ? 'has-lesson' : ''}`}
                style={
                  intensity > 0
                    ? {
                        background: `rgba(127,127,127,${0.04 + intensity * 0.14})`,
                      }
                    : undefined
                }
                onClick={() => n > 0 && onClickDay(iso)}
                disabled={n === 0}
                title={title}
                aria-label={`${monthName} ${day}${title ? ', ' + title : ''}`}
              >
                <span className="cp-day-number">{day}</span>
                {n > 0 && (
                  <span
                    className={`cp-day-dot ${hasImportant ? 'important' : ''}`}
                    aria-hidden="true"
                  />
                )}
                {n > 1 && (
                  <span className="cp-day-count" aria-hidden="true">
                    {n}
                  </span>
                )}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

function truncate(s: string, n: number): string {
  const flat = s.replace(/\s+/g, ' ').trim();
  return flat.length > n ? flat.slice(0, n - 1) + '…' : flat;
}
