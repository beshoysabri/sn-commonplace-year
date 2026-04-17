import { useState } from 'react';
import type { Theme } from '../types/commonplace';
import { Modal } from './shared/Modal';
import { ConfirmDialog } from './shared/ConfirmDialog';
import { ColorPicker } from './shared/ColorPicker';
import { TrashIcon } from '../lib/icons';

interface ThemeModalProps {
  theme: Theme;
  isNew?: boolean;
  citationCount?: number;
  onSave: (updated: Theme) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function ThemeModal({
  theme,
  isNew = false,
  citationCount = 0,
  onSave,
  onDelete,
  onClose,
}: ThemeModalProps) {
  const [form, setForm] = useState<Theme>(theme);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const patch = <K extends keyof Theme>(key: K, value: Theme[K]) => {
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
      <button type="button" className="cp-btn cp-btn-primary" onClick={handleSave}>
        {isNew ? 'Create' : 'Save'}
      </button>
    </div>
  );

  return (
    <>
      <Modal
        title={isNew ? 'New theme' : `Edit ${theme.name}`}
        size="sm"
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
          <label className="cp-form-field">
            <span className="cp-form-label">Name</span>
            <input
              type="text"
              className="cp-input"
              value={form.name}
              onChange={(e) => patch('name', e.target.value)}
              placeholder="path"
            />
          </label>

          <div className="cp-form-field">
            <span className="cp-form-label">Color</span>
            <ColorPicker
              value={form.color}
              onChange={(hex) => patch('color', hex)}
            />
          </div>

          <label className="cp-form-field">
            <span className="cp-form-label">Description (optional)</span>
            <textarea
              className="cp-textarea"
              value={form.description ?? ''}
              onChange={(e) =>
                patch('description', e.target.value || undefined)
              }
              rows={3}
              placeholder="What this theme means to you."
            />
          </label>

          {!isNew && citationCount > 0 && (
            <p className="cp-form-note">
              Used by {citationCount} lesson{citationCount === 1 ? '' : 's'}.
            </p>
          )}
        </form>
      </Modal>
      {confirmDelete && onDelete && (
        <ConfirmDialog
          title={`Delete ${theme.name}?`}
          message={
            citationCount > 0
              ? `${citationCount} lesson${citationCount === 1 ? '' : 's'} use this theme. Deleting untags them.`
              : 'This theme is unused. Delete permanently?'
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
