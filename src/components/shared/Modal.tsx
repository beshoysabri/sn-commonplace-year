import { useEffect, useRef, type ReactNode } from 'react';
import { CloseIcon } from '../../lib/icons';

interface ModalProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  /** Extra class on the `.cp-modal-content` element (e.g. `cp-modal-wide`). */
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ title, children, footer, onClose, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="cp-modal-overlay"
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={`cp-modal-content cp-modal-${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="cp-modal-header">
          <span className="cp-modal-title">{title}</span>
          <button
            className="cp-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="cp-modal-body">{children}</div>
        {footer && <div className="cp-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
