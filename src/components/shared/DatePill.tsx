import type { ISODate } from '../../types/commonplace';
import { formatDatePillText } from '../../lib/dates';

interface DatePillProps {
  date: ISODate;
  /** Include weekday in the rendered form (e.g. "Feb 14 · Tue"). */
  withWeekday?: boolean;
  /** Click handler (optional; chip is a plain span if omitted). */
  onClick?: () => void;
}

export function DatePill({
  date,
  withWeekday = false,
  onClick,
}: DatePillProps) {
  const label = formatDatePillText(date, withWeekday);
  const handleClick = onClick
    ? (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
      }
    : undefined;
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      className="cp-date-pill"
      onClick={handleClick}
      type={onClick ? 'button' : undefined}
    >
      {label}
    </Tag>
  );
}
