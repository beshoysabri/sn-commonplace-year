import { useEffect, useRef, useState } from 'react';
import { DownloadIcon } from '../../lib/icons';

export interface ExportOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
}

interface ExportMenuProps {
  options: ExportOption[];
}

export function ExportMenu({ options }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="cp-export-menu" ref={ref}>
      <button
        type="button"
        className="cp-btn cp-btn-ghost cp-btn-icon"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Export"
      >
        <DownloadIcon size={14} />
        <span>Export</span>
      </button>
      {open && (
        <div className="cp-export-dropdown" role="menu">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="cp-export-option"
              onClick={() => {
                opt.onSelect();
                setOpen(false);
              }}
              role="menuitem"
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
