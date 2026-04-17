import type { Lesson } from '../types/commonplace';
import { CloseIcon, CalendarDotIcon } from '../lib/icons';

interface OnThisDayBannerProps {
  lessons: Lesson[];
  onOpenLesson: (lesson: Lesson) => void;
  onDismiss: () => void;
}

export function OnThisDayBanner({
  lessons,
  onOpenLesson,
  onDismiss,
}: OnThisDayBannerProps) {
  if (lessons.length === 0) return null;
  const first = lessons[0];
  const rest = lessons.slice(1);

  return (
    <div className="cp-otd-banner" role="note">
      <span className="cp-otd-icon" aria-hidden="true">
        <CalendarDotIcon size={14} />
      </span>
      <span className="cp-otd-label">On this day</span>
      <button
        type="button"
        className="cp-otd-lesson"
        onClick={() => onOpenLesson(first)}
      >
        <span className="cp-otd-number">{first.number}</span>
        <span className="cp-otd-body">
          {first.title ?? truncate(first.body, 100)}
        </span>
      </button>
      {rest.length > 0 && (
        <span className="cp-otd-more">
          +{rest.length} more
        </span>
      )}
      <button
        type="button"
        className="cp-otd-close"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        <CloseIcon size={12} />
      </button>
    </div>
  );
}

function truncate(s: string, n: number): string {
  const flat = s.replace(/\s+/g, ' ').trim();
  return flat.length > n ? flat.slice(0, n - 1) + '…' : flat;
}
