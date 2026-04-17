import type { ReactNode } from 'react';

interface StatsCardProps {
  label: string;
  value: number | string;
  caption?: string;
  accent?: 'default' | 'priority' | 'success' | 'warning' | 'danger';
  icon?: ReactNode;
}

export function StatsCard({
  label,
  value,
  caption,
  accent = 'default',
  icon,
}: StatsCardProps) {
  return (
    <div className={`cp-stats-card cp-stats-${accent}`}>
      {icon && <div className="cp-stats-icon">{icon}</div>}
      <div className="cp-stats-value">{value}</div>
      <div className="cp-stats-label">{label}</div>
      {caption && <div className="cp-stats-caption">{caption}</div>}
    </div>
  );
}
