import { useMemo, useRef, useState } from 'react';
import { ChevronDownIcon, CloseIcon, PlusIcon } from '../../lib/icons';

export interface SingleSelectOption {
  id: string;
  label: string;
  hint?: string;
}

interface SingleSelectProps {
  options: SingleSelectOption[];
  selectedId?: string;
  onChange: (id: string | undefined) => void;
  onCreate?: (name: string) => string;
  placeholder?: string;
  clearable?: boolean;
}

/**
 * Minimal combo-select with typeahead + optional quick-create.
 */
export function SingleSelect({
  options,
  selectedId,
  onChange,
  onCreate,
  placeholder = 'Choose…',
  clearable = true,
}: SingleSelectProps) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => options.find((o) => o.id === selectedId),
    [options, selectedId],
  );

  const q = input.trim().toLowerCase();
  const suggestions = useMemo(() => {
    if (!q) return options.slice(0, 10);
    return options
      .filter((o) => o.label.toLowerCase().includes(q))
      .slice(0, 12);
  }, [options, q]);

  const canCreate =
    !!onCreate &&
    q.length > 0 &&
    !options.some((o) => o.label.toLowerCase() === q);

  const choose = (id: string | undefined) => {
    onChange(id);
    setInput('');
    setOpen(false);
  };

  const createNow = () => {
    if (!onCreate || !q) return;
    const newId = onCreate(input.trim());
    choose(newId);
  };

  return (
    <div className="cp-single-select">
      <div className="cp-single-trigger" onClick={() => { setOpen(true); inputRef.current?.focus(); }}>
        {selected && !input ? (
          <span className="cp-single-value">{selected.label}</span>
        ) : null}
        <input
          ref={inputRef}
          className="cp-single-input"
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder={selected ? '' : placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (suggestions.length > 0) choose(suggestions[0].id);
              else if (canCreate) createNow();
            }
          }}
        />
        {clearable && selected && !input && (
          <button
            type="button"
            className="cp-single-clear"
            onClick={(e) => { e.stopPropagation(); choose(undefined); }}
            aria-label="Clear"
          >
            <CloseIcon size={12} />
          </button>
        )}
        <ChevronDownIcon size={12} />
      </div>
      {open && (suggestions.length > 0 || canCreate) && (
        <div className="cp-single-menu">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              className="cp-single-option"
              onMouseDown={(e) => { e.preventDefault(); choose(s.id); }}
            >
              <span>{s.label}</span>
              {s.hint && <span className="cp-mschips-hint">{s.hint}</span>}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              className="cp-mschips-create"
              onMouseDown={(e) => { e.preventDefault(); createNow(); }}
            >
              <PlusIcon size={12} />
              <span>Create “{input.trim()}”</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
