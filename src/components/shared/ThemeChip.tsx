import type { Theme } from '../../types/commonplace';
import { hexToRgba } from '../../lib/colors';

interface ThemeChipProps {
  theme: Theme;
  onClick?: (theme: Theme) => void;
  active?: boolean;
}

export function ThemeChip({ theme, onClick, active = false }: ThemeChipProps) {
  const style = {
    background: active
      ? hexToRgba(theme.color, 0.24)
      : hexToRgba(theme.color, 0.1),
    borderColor: hexToRgba(theme.color, active ? 0.5 : 0.25),
    color: theme.color,
  };

  const handleClick = onClick
    ? (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick(theme);
      }
    : undefined;

  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      className={`cp-theme-chip ${active ? 'active' : ''}`}
      style={style}
      onClick={handleClick}
      type={onClick ? 'button' : undefined}
    >
      {theme.name}
    </Tag>
  );
}
