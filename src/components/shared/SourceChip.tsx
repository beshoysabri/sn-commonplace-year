import type { Source } from '../../types/commonplace';
import { hexToRgba } from '../../lib/colors';

interface SourceChipProps {
  source: Source;
  onClick?: (source: Source) => void;
  /** 'tinted' uses the source's color as background; 'quiet' uses a subtle dot. */
  variant?: 'tinted' | 'quiet';
}

export function SourceChip({ source, onClick, variant = 'quiet' }: SourceChipProps) {
  const style =
    variant === 'tinted'
      ? {
          background: hexToRgba(source.color, 0.16),
          color: source.color,
          borderColor: hexToRgba(source.color, 0.35),
        }
      : undefined;

  const handleClick = onClick
    ? (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick(source);
      }
    : undefined;

  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      className={`cp-source-chip cp-source-chip-${variant}`}
      style={style}
      onClick={handleClick}
      type={onClick ? 'button' : undefined}
    >
      {variant === 'quiet' && (
        <span
          className="cp-source-chip-dot"
          style={{ background: source.color }}
          aria-hidden="true"
        />
      )}
      <span className="cp-source-chip-name">{source.name}</span>
    </Tag>
  );
}
