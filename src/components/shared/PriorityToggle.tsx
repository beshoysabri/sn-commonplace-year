import { StarFilledIcon, StarOutlineIcon } from '../../lib/icons';

interface PriorityToggleProps {
  important: boolean;
  onToggle: () => void;
  size?: number;
  /** Visual style — 'plain' shows only the icon, 'pill' wraps it in a chip. */
  variant?: 'plain' | 'pill';
  'aria-label'?: string;
}

export function PriorityToggle({
  important,
  onToggle,
  size = 16,
  variant = 'plain',
  ...ariaProps
}: PriorityToggleProps) {
  const label =
    ariaProps['aria-label'] ??
    (important ? 'Unflag as important' : 'Mark as important');

  return (
    <button
      type="button"
      className={`cp-priority-toggle cp-priority-${variant} ${important ? 'on' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={label}
      aria-pressed={important}
      title={label}
    >
      {important ? <StarFilledIcon size={size} /> : <StarOutlineIcon size={size} />}
    </button>
  );
}
