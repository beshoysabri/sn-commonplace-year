import { forwardRef } from 'react';
import { CloseIcon, SearchIcon } from '../../lib/icons';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  autoFocus?: boolean;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar(
    { value, onChange, placeholder = 'Search…', onClear, autoFocus },
    ref,
  ) {
    return (
      <div className="cp-search-bar">
        <SearchIcon size={14} aria-hidden="true" />
        <input
          ref={ref}
          type="search"
          className="cp-search-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label={placeholder}
        />
        {value && (
          <button
            type="button"
            className="cp-search-clear"
            onClick={() => (onClear ? onClear() : onChange(''))}
            aria-label="Clear search"
          >
            <CloseIcon size={12} />
          </button>
        )}
      </div>
    );
  },
);
