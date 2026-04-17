interface LessonNumberBadgeProps {
  number: string;
  /** 'margin' for Book view (subtle), 'pill' for List view (contained). */
  variant?: 'margin' | 'pill';
}

export function LessonNumberBadge({
  number,
  variant = 'pill',
}: LessonNumberBadgeProps) {
  return (
    <span className={`cp-lesson-num cp-lesson-num-${variant}`}>
      {number}
    </span>
  );
}
