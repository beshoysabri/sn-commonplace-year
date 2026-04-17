import { PALETTE } from '../../lib/colors';
import { CheckIcon } from '../../lib/icons';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  /** Allow the user to type a custom hex below the palette. */
  allowCustom?: boolean;
}

export function ColorPicker({
  value,
  onChange,
  allowCustom = true,
}: ColorPickerProps) {
  const active = value.toLowerCase();
  return (
    <div className="cp-color-picker">
      <div className="cp-color-swatches">
        {PALETTE.map((c) => {
          const isActive = c.hex.toLowerCase() === active;
          return (
            <button
              key={c.hex}
              type="button"
              className={`cp-color-swatch ${isActive ? 'active' : ''}`}
              style={{ background: c.hex }}
              onClick={() => onChange(c.hex)}
              title={c.name}
              aria-label={c.name}
              aria-pressed={isActive}
            >
              {isActive && <CheckIcon size={12} />}
            </button>
          );
        })}
      </div>
      {allowCustom && (
        <label className="cp-color-custom">
          <span>Custom</span>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Custom color"
          />
          <input
            type="text"
            className="cp-color-custom-text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={7}
            aria-label="Custom hex"
          />
        </label>
      )}
    </div>
  );
}
