import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="cp-empty-state">
      {icon && <div className="cp-empty-icon">{icon}</div>}
      <h3 className="cp-empty-title">{title}</h3>
      {description && <p className="cp-empty-description">{description}</p>}
      {action && <div className="cp-empty-action">{action}</div>}
    </div>
  );
}
