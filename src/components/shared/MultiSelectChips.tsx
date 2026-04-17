import { useMemo, useRef, useState } from 'react';
import { CloseIcon, PlusIcon } from '../../lib/icons';

export interface MultiSelectOption {
  id: string;
  label: string;
  hint?: string;
  color?: string;
}

interface MultiSelectChipsProps {
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /**
   * When provided, enables quick-create: typing a name that doesn't match
   * and pressing Enter (or clicking the "+ Create" suggestion) creates a
   * new option and selects it. Returns the new option's id.
   */
  onCreate?: (name: string) => string;
  placeholder?: string;
  /** Empty state when no options exist and `onCreate` is unset. */
  emptyLabel?: string;
}

/**
 * A chip-style multi-select with typeahead suggestions and optional
 * quick-create. Used for source, theme, and reference pickers in the
 * LessonModal.
 */
export function MultiSelectChips({
  options,
  selectedIds,
  onChange,
  onCreate,
  placeholder = 'Add…',
  emptyLabel,
}: MultiSelectChipsProps) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const optionById = useMemo(() => {
    const m = new Map(options.map((o) => [o.id, o]));
    return m;
  }, [options]);

  const selected = selectedIds
    .map((id) => optionById.get(id))
    .filter((o): o is MultiSelectOption => !!o);

  const q = input.trim().toLowerCase();
  const suggestions = useMemo(() => {
    const notSelected = options.filter((o) => !selectedIds.includes(o.id));
    if (!q) return notSelected.slice(0, 10);
    return notSelected
      .filter((o) => o.label.toLowerCase().includes(q))
      .slice(0, 12);
  }, [options, selectedIds, q]);

  const canCreate =
    !!onCreate &&
    q.length > 0 &&
    !options.some((o) => o.label.toLowerCase() === q);

  const addById = (id: string) => {
    if (selectedIds.includes(id)) return;
    onChange([...selectedIds, id]);
    setInput('');
  };

  const remove = (id: string) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  const createNow = () => {
    if (!onCreate || !q) return;
    const newId = onCreate(input.trim());
    onChange([...selectedIds, newId]);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="cp-mschips">
      <div className="cp-mschips-input-row" onClick={() => inputRef.current?.focus()}>
        {selected.map((o) => (
          <span
            key={o.id}
            className="cp-mschips-chip"
            style={
              o.color
                ? { borderColor: o.color, color: o.color }
                : undefined
            }
          >
            <span>{o.label}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(o.id);
              }}
              className="cp-mschips-remove"
              aria-label={`Remove ${o.label}`}
            >
              <CloseIcon size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="cp-mschips-input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // delay so suggestion click registers
            setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (suggestions.length > 0) {
                addById(suggestions[0].id);
              } else if (canCreate) {
                createNow();
              }
            } else if (e.key === 'Backspace' && !input && selected.length > 0) {
              remove(selected[selected.length - 1].id);
            }
          }}
          placeholder={selected.length === 0 ? placeholder : ''}
        />
      </div>
      {open && (suggestions.length > 0 || canCreate || (options.length === 0 && emptyLabel)) && (
        <div className="cp-mschips-menu">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              className="cp-mschips-suggestion"
              onMouseDown={(e) => {
                e.preventDefault();
                addById(s.id);
              }}
            >
              {s.color && (
                <span
                  className="cp-mschips-dot"
                  style={{ background: s.color }}
                />
              )}
              <span>{s.label}</span>
              {s.hint && <span className="cp-mschips-hint">{s.hint}</span>}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              className="cp-mschips-create"
              onMouseDown={(e) => {
                e.preventDefault();
                createNow();
              }}
            >
              <PlusIcon size={12} />
              <span>Create “{input.trim()}”</span>
            </button>
          )}
          {options.length === 0 && !canCreate && emptyLabel && (
            <span className="cp-mschips-empty">{emptyLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
