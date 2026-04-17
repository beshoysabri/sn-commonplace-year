import { useState } from 'react';
import type { Rating, Source, SourceKind } from '../types/commonplace';
import { SOURCE_KINDS } from '../types/commonplace';
import { Modal } from './shared/Modal';
import { ConfirmDialog } from './shared/ConfirmDialog';
import { ColorPicker } from './shared/ColorPicker';
import { TrashIcon } from '../lib/icons';

interface SourceModalProps {
  source: Source;
  isNew?: boolean;
  citationCount?: number;
  onSave: (updated: Source) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function SourceModal({
  source,
  isNew = false,
  citationCount = 0,
  onSave,
  onDelete,
  onClose,
}: SourceModalProps) {
  const [form, setForm] = useState<Source>(source);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const patch = <K extends keyof Source>(key: K, value: Source[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave({ ...form, updatedAt: new Date().toISOString() });
    onClose();
  };

  const footer = (
    <div className="cp-modal-footer-actions">
      {onDelete && !isNew && (
        <button
          type="button"
          className="cp-btn cp-btn-ghost cp-btn-danger-ghost"
          onClick={() => setConfirmDelete(true)}
        >
          <TrashIcon size={12} /> Delete
        </button>
      )}
      <div className="cp-modal-footer-spacer" />
      <button type="button" className="cp-btn cp-btn-ghost" onClick={onClose}>
        Cancel
      </button>
      <button
        type="button"
        className="cp-btn cp-btn-primary"
        onClick={handleSave}
      >
        {isNew ? 'Create' : 'Save'}
      </button>
    </div>
  );

  return (
    <>
      <Modal
        title={isNew ? 'New source' : `Edit ${source.name}`}
        size="md"
        onClose={onClose}
        footer={footer}
      >
        <form
          className="cp-lesson-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="cp-form-row-inline">
            <label className="cp-form-field cp-form-field-wide">
              <span className="cp-form-label">Name</span>
              <input
                type="text"
                className="cp-input"
                value={form.name}
                onChange={(e) => patch('name', e.target.value)}
                placeholder="Carl Jung"
              />
            </label>
            <label className="cp-form-field">
              <span className="cp-form-label">Kind</span>
              <select
                className="cp-input"
                value={form.kind}
                onChange={(e) => patch('kind', e.target.value as SourceKind)}
              >
                {SOURCE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="cp-form-row-inline">
            <label className="cp-form-field">
              <span className="cp-form-label">Life years (optional)</span>
              <input
                type="text"
                className="cp-input"
                value={form.lifeYears ?? ''}
                onChange={(e) =>
                  patch('lifeYears', e.target.value || undefined)
                }
                placeholder="1875–1961"
              />
            </label>
            <label className="cp-form-field cp-form-field-wide">
              <span className="cp-form-label">Role (optional)</span>
              <input
                type="text"
                className="cp-input"
                value={form.role ?? ''}
                onChange={(e) => patch('role', e.target.value || undefined)}
                placeholder="analytical psychologist"
              />
            </label>
          </div>

          <div className="cp-form-field">
            <span className="cp-form-label">Color</span>
            <ColorPicker
              value={form.color}
              onChange={(hex) => patch('color', hex)}
            />
          </div>

          <div className="cp-form-field">
            <span className="cp-form-label">Reverence (optional)</span>
            <div className="cp-reverence-row">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`cp-reverence-star ${(form.reverence ?? 0) >= n ? 'on' : ''}`}
                  onClick={() =>
                    patch(
                      'reverence',
                      (form.reverence === n ? undefined : (n as Rating)),
                    )
                  }
                  aria-label={`${n} star${n === 1 ? '' : 's'}`}
                >
                  ★
                </button>
              ))}
              {form.reverence && (
                <button
                  type="button"
                  className="cp-btn cp-btn-ghost cp-btn-icon"
                  onClick={() => patch('reverence', undefined)}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <label className="cp-form-field">
            <span className="cp-form-label">Notes (optional)</span>
            <textarea
              className="cp-textarea"
              value={form.notes ?? ''}
              onChange={(e) => patch('notes', e.target.value || undefined)}
              rows={4}
              placeholder="Biographical or contextual notes in your own words."
            />
          </label>

          {!isNew && citationCount > 0 && (
            <p className="cp-form-note">
              Cited in {citationCount} lesson{citationCount === 1 ? '' : 's'}.
            </p>
          )}
        </form>
      </Modal>
      {confirmDelete && onDelete && (
        <ConfirmDialog
          title={`Delete ${source.name}?`}
          message={
            citationCount > 0
              ? `${citationCount} lesson${citationCount === 1 ? '' : 's'} cite this source. Deleting removes the source; the lessons remain but lose this attribution.`
              : 'This source is not cited anywhere. Delete permanently?'
          }
          confirmLabel="Delete"
          destructive
          onConfirm={() => {
            onDelete();
            setConfirmDelete(false);
            onClose();
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
