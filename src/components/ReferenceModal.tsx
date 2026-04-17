import { useState } from 'react';
import type {
  Rating,
  Reference,
  ReferenceKind,
  ReferenceStatus,
} from '../types/commonplace';
import { REFERENCE_KINDS, REFERENCE_STATUSES } from '../types/commonplace';
import { Modal } from './shared/Modal';
import { ConfirmDialog } from './shared/ConfirmDialog';
import { TrashIcon } from '../lib/icons';

interface ReferenceModalProps {
  reference: Reference;
  isNew?: boolean;
  citationCount?: number;
  onSave: (updated: Reference) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function ReferenceModal({
  reference,
  isNew = false,
  citationCount = 0,
  onSave,
  onDelete,
  onClose,
}: ReferenceModalProps) {
  const [form, setForm] = useState<Reference>(reference);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const patch = <K extends keyof Reference>(key: K, value: Reference[K]) => {
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
        title={isNew ? 'New reference' : `Edit ${reference.title}`}
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
          <label className="cp-form-field">
            <span className="cp-form-label">Title</span>
            <input
              type="text"
              className="cp-input"
              value={form.title}
              onChange={(e) => patch('title', e.target.value)}
              placeholder="The Road Less Traveled"
            />
          </label>

          <div className="cp-form-row-inline">
            <label className="cp-form-field cp-form-field-wide">
              <span className="cp-form-label">Author (optional)</span>
              <input
                type="text"
                className="cp-input"
                value={form.author ?? ''}
                onChange={(e) => patch('author', e.target.value || undefined)}
                placeholder="M. Scott Peck"
              />
            </label>
            <label className="cp-form-field cp-form-field-narrow">
              <span className="cp-form-label">Year</span>
              <input
                type="number"
                className="cp-input"
                value={form.year ?? ''}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  patch('year', Number.isFinite(n) && n > 0 ? n : undefined);
                }}
                placeholder="1978"
              />
            </label>
          </div>

          <div className="cp-form-row-inline">
            <label className="cp-form-field">
              <span className="cp-form-label">Kind</span>
              <select
                className="cp-input"
                value={form.kind}
                onChange={(e) => patch('kind', e.target.value as ReferenceKind)}
              >
                {REFERENCE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
            <label className="cp-form-field">
              <span className="cp-form-label">Status</span>
              <select
                className="cp-input"
                value={form.status ?? ''}
                onChange={(e) =>
                  patch(
                    'status',
                    (e.target.value as ReferenceStatus) || undefined,
                  )
                }
              >
                <option value="">(none)</option>
                {REFERENCE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="cp-form-field">
              <span className="cp-form-label">Rating</span>
              <div className="cp-reverence-row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`cp-reverence-star ${(form.rating ?? 0) >= n ? 'on' : ''}`}
                    onClick={() =>
                      patch(
                        'rating',
                        form.rating === n ? undefined : (n as Rating),
                      )
                    }
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </label>
          </div>

          <label className="cp-form-field">
            <span className="cp-form-label">URL (optional)</span>
            <input
              type="url"
              className="cp-input"
              value={form.url ?? ''}
              onChange={(e) => patch('url', e.target.value || undefined)}
              placeholder="https://"
            />
          </label>

          <label className="cp-form-field">
            <span className="cp-form-label">Cover image URL (optional)</span>
            <input
              type="url"
              className="cp-input"
              value={form.coverUrl ?? ''}
              onChange={(e) => patch('coverUrl', e.target.value || undefined)}
              placeholder="https://…/cover.jpg"
            />
          </label>

          <label className="cp-form-field">
            <span className="cp-form-label">Notes (optional)</span>
            <textarea
              className="cp-textarea"
              value={form.notes ?? ''}
              onChange={(e) => patch('notes', e.target.value || undefined)}
              rows={3}
              placeholder="Your notes on the work as a whole."
            />
          </label>

          {!isNew && citationCount > 0 && (
            <p className="cp-form-note">
              Linked from {citationCount} lesson
              {citationCount === 1 ? '' : 's'}.
            </p>
          )}
        </form>
      </Modal>
      {confirmDelete && onDelete && (
        <ConfirmDialog
          title={`Delete ${reference.title}?`}
          message={
            citationCount > 0
              ? `${citationCount} lesson${citationCount === 1 ? '' : 's'} link to this reference. Deleting unlinks them but keeps the lessons.`
              : 'This reference is unlinked. Delete permanently?'
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
