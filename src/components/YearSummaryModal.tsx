import { useState } from 'react';
import type { CommonplaceYear } from '../types/commonplace';
import { Modal } from './shared/Modal';

interface YearSummaryModalProps {
  data: CommonplaceYear;
  onSave: (updated: Partial<CommonplaceYear>) => void;
  onClose: () => void;
}

export function YearSummaryModal({
  data,
  onSave,
  onClose,
}: YearSummaryModalProps) {
  const [year, setYear] = useState<string>(String(data.year));
  const [theme, setTheme] = useState<string>(data.theme ?? '');
  const [summary, setSummary] = useState<string>(data.summary ?? '');
  const [settings, setSettings] = useState(data.settings);

  const handleSave = () => {
    const parsedYear = Number.parseInt(year, 10);
    onSave({
      year: Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : data.year,
      theme: theme.trim() || undefined,
      summary: summary.trim() || undefined,
      settings,
    });
    onClose();
  };

  const footer = (
    <div className="cp-modal-footer-actions">
      <div className="cp-modal-footer-spacer" />
      <button type="button" className="cp-btn cp-btn-ghost" onClick={onClose}>
        Cancel
      </button>
      <button type="button" className="cp-btn cp-btn-primary" onClick={handleSave}>
        Save
      </button>
    </div>
  );

  return (
    <Modal title="Edit year" size="md" onClose={onClose} footer={footer}>
      <form
        className="cp-lesson-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div className="cp-form-row-inline">
          <label className="cp-form-field">
            <span className="cp-form-label">Year</span>
            <input
              type="number"
              className="cp-input"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min={1}
              max={9999}
            />
          </label>
          <label className="cp-form-field cp-form-field-wide">
            <span className="cp-form-label">Theme of the year (optional)</span>
            <input
              type="text"
              className="cp-input"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="CODE, PATH, SURRENDER…"
              maxLength={40}
            />
          </label>
        </div>

        <label className="cp-form-field">
          <span className="cp-form-label">
            Summary — a letter to your future self
          </span>
          <textarea
            className="cp-textarea cp-textarea-serif"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={6}
            placeholder="What you want to remember about this year."
          />
        </label>

        <fieldset className="cp-form-field">
          <legend className="cp-form-label">Display settings</legend>
          <label className="cp-form-radio">
            <input
              type="checkbox"
              checked={settings.showNumbersInBookView}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  showNumbersInBookView: e.target.checked,
                })
              }
            />
            <span>Show lesson numbers in Book view</span>
          </label>
          <label className="cp-form-radio">
            <input
              type="checkbox"
              checked={settings.autoNumber}
              onChange={(e) =>
                setSettings({ ...settings, autoNumber: e.target.checked })
              }
            />
            <span>Auto-number new lessons</span>
          </label>
          <label className="cp-form-radio">
            <input
              type="checkbox"
              checked={settings.paperMode}
              onChange={(e) =>
                setSettings({ ...settings, paperMode: e.target.checked })
              }
            />
            <span>Paper mode (warm reading surface)</span>
          </label>
        </fieldset>

        <label className="cp-form-field">
          <span className="cp-form-label">Number format</span>
          <input
            type="text"
            className="cp-input"
            value={settings.numberFormat}
            onChange={(e) =>
              setSettings({ ...settings, numberFormat: e.target.value })
            }
            placeholder="YY#N"
          />
          <span className="cp-form-hint">
            Tokens: YY (2-digit year), YYYY (4-digit year), N (1-based index),
            NNN (zero-padded index). Default: YY#N → “23#1”.
          </span>
        </label>
      </form>
    </Modal>
  );
}
