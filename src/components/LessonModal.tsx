import { useMemo, useState } from 'react';
import type {
  CommonplaceYear,
  Lesson,
  UUID,
  Visibility,
} from '../types/commonplace';
import { Modal } from './shared/Modal';
import { PriorityToggle } from './shared/PriorityToggle';
import { ConfirmDialog } from './shared/ConfirmDialog';
import { MultiSelectChips } from './shared/MultiSelectChips';
import { SingleSelect } from './shared/SingleSelect';
import { FragmentAttributionEditor } from './lesson/FragmentAttributionEditor';
import { TrashIcon } from '../lib/icons';
import { createNewSource, createNewTheme, createNewReference } from '../lib/data';

interface LessonModalProps {
  lesson: Lesson;
  data: CommonplaceYear;
  isNew?: boolean;
  onSave: (updated: Lesson, dataPatches: DataPatches) => void;
  onDelete?: () => void;
  onClose: () => void;
}

/** Side-effects the modal may produce: new sources/themes/references created
 *  by the user during the edit. We batch and apply them in App so they end
 *  up in the persisted data. */
export interface DataPatches {
  newSources: CommonplaceYear['sources'];
  newThemes: CommonplaceYear['themes'];
  newReferences: CommonplaceYear['references'];
}

export function LessonModal({
  lesson,
  data,
  isNew = false,
  onSave,
  onDelete,
  onClose,
}: LessonModalProps) {
  const [form, setForm] = useState<Lesson>(lesson);
  // Buffer for sources/themes/references the user invents inline. These
  // are materialized into `data` when the modal is saved.
  const [newSources, setNewSources] = useState<CommonplaceYear['sources']>([]);
  const [newThemes, setNewThemes] = useState<CommonplaceYear['themes']>([]);
  const [newReferences, setNewReferences] = useState<
    CommonplaceYear['references']
  >([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const sourcesAll = useMemo(
    () => [...data.sources, ...newSources],
    [data.sources, newSources],
  );
  const themesAll = useMemo(
    () => [...data.themes, ...newThemes],
    [data.themes, newThemes],
  );
  const referencesAll = useMemo(
    () => [...data.references, ...newReferences],
    [data.references, newReferences],
  );

  const patch = <K extends keyof Lesson>(key: K, value: Lesson[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateSource = (name: string): string => {
    const s = createNewSource(name);
    setNewSources((prev) => [...prev, s]);
    return s.id;
  };

  const handleCreateTheme = (name: string): string => {
    const t = createNewTheme(name);
    setNewThemes((prev) => [...prev, t]);
    return t.id;
  };

  const handleCreateReference = (title: string): string => {
    const r = createNewReference(title);
    setNewReferences((prev) => [...prev, r]);
    return r.id;
  };

  const handleSave = () => {
    // Normalize: derive sourceIds as the union of explicit sourceIds plus
    // every id mentioned across bodyAttributions, so People view always
    // indexes correctly.
    const fromFragments = new Set<UUID>();
    for (const ids of form.bodyAttributions ?? []) {
      for (const id of ids) fromFragments.add(id);
    }
    const mergedSourceIds = [...form.sourceIds];
    for (const id of fromFragments) {
      if (!mergedSourceIds.includes(id)) mergedSourceIds.push(id);
    }
    const finalForm: Lesson = {
      ...form,
      sourceIds: mergedSourceIds,
      updatedAt: new Date().toISOString(),
    };
    onSave(finalForm, { newSources, newThemes, newReferences });
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
        title={isNew ? 'New lesson' : `Edit ${form.number}`}
        size="lg"
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
          <div className="cp-form-row cp-form-row-inline">
            <label className="cp-form-field">
              <span className="cp-form-label">Number</span>
              <input
                type="text"
                className="cp-input"
                value={form.number}
                onChange={(e) => patch('number', e.target.value)}
                placeholder="23#1"
              />
            </label>
            <div className="cp-form-field cp-form-field-priority">
              <span className="cp-form-label">Important</span>
              <PriorityToggle
                important={form.important}
                onToggle={() => patch('important', !form.important)}
                variant="pill"
              />
            </div>
            <label className="cp-form-field">
              <span className="cp-form-label">Date (optional)</span>
              <div className="cp-input-with-clear">
                <input
                  type="date"
                  className="cp-input"
                  value={form.date ?? ''}
                  onChange={(e) => patch('date', e.target.value || undefined)}
                />
                {form.date && (
                  <button
                    type="button"
                    className="cp-input-clear"
                    onClick={() => patch('date', undefined)}
                    aria-label="Clear date"
                  >
                    ×
                  </button>
                )}
              </div>
            </label>
          </div>

          <label className="cp-form-field">
            <span className="cp-form-label">Title — one-line distillation (optional)</span>
            <input
              type="text"
              className="cp-input"
              value={form.title ?? ''}
              onChange={(e) => patch('title', e.target.value || undefined)}
              placeholder="The path appears only to those who start walking."
            />
          </label>

          <div className="cp-form-row cp-form-row-inline">
            <label className="cp-form-field cp-form-field-wide">
              <span className="cp-form-label">Original text (optional)</span>
              <input
                type="text"
                className="cp-input"
                value={form.originalText ?? ''}
                onChange={(e) =>
                  patch('originalText', e.target.value || undefined)
                }
                placeholder="AUT VIAM INVENIAM AUT FACIAM"
              />
            </label>
            <label className="cp-form-field cp-form-field-narrow">
              <span className="cp-form-label">Language</span>
              <input
                type="text"
                className="cp-input"
                value={form.originalLanguage ?? ''}
                onChange={(e) =>
                  patch('originalLanguage', e.target.value || undefined)
                }
                placeholder="latin"
              />
            </label>
          </div>

          <label className="cp-form-field">
            <span className="cp-form-label">
              Body — use “ / ” to separate synthesized fragments
            </span>
            <textarea
              className="cp-textarea cp-textarea-serif"
              value={form.body}
              onChange={(e) => patch('body', e.target.value)}
              rows={6}
              placeholder={'"Quote one." /\nQuote two. /\nQuote three.'}
            />
          </label>

          <FragmentAttributionEditor
            body={form.body}
            sources={sourcesAll}
            bodyAttributions={form.bodyAttributions}
            onChange={(next) => patch('bodyAttributions', next)}
            onCreateSource={handleCreateSource}
            data={data}
          />

          <label className="cp-form-field">
            <span className="cp-form-label">
              Sources — union of everyone cited in this lesson
            </span>
            <MultiSelectChips
              options={sourcesAll.map((s) => ({
                id: s.id,
                label: s.name,
                hint: s.role,
                color: s.color,
              }))}
              selectedIds={form.sourceIds}
              onChange={(ids) => patch('sourceIds', ids)}
              onCreate={handleCreateSource}
              placeholder="Add a source (Carl Jung, Rumi…)"
            />
          </label>

          <div className="cp-form-row cp-form-row-inline">
            <label className="cp-form-field cp-form-field-wide">
              <span className="cp-form-label">Themes</span>
              <MultiSelectChips
                options={themesAll.map((t) => ({
                  id: t.id,
                  label: t.name,
                  color: t.color,
                }))}
                selectedIds={form.themeIds}
                onChange={(ids) => patch('themeIds', ids)}
                onCreate={handleCreateTheme}
                placeholder="path, ego, method…"
              />
            </label>
            <label className="cp-form-field cp-form-field-wide">
              <span className="cp-form-label">Reference (optional)</span>
              <SingleSelect
                options={referencesAll.map((r) => ({
                  id: r.id,
                  label: r.title,
                  hint: r.author,
                }))}
                selectedId={form.referenceId}
                onChange={(id) => patch('referenceId', id)}
                onCreate={handleCreateReference}
                placeholder="Pick a book, article…"
              />
            </label>
          </div>

          <label className="cp-form-field">
            <span className="cp-form-label">Reflection — your own voice</span>
            <textarea
              className="cp-textarea"
              value={form.reflection ?? ''}
              onChange={(e) =>
                patch('reflection', e.target.value || undefined)
              }
              rows={3}
              placeholder="What this meant to you, in your own words."
            />
          </label>

          <fieldset className="cp-form-field cp-form-radio-group">
            <legend className="cp-form-label">Visibility</legend>
            <label className="cp-form-radio">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={form.visibility === 'private'}
                onChange={() => patch('visibility', 'private' as Visibility)}
              />
              <span>Private — mine alone</span>
            </label>
            <label className="cp-form-radio">
              <input
                type="radio"
                name="visibility"
                value="shareable"
                checked={form.visibility === 'shareable'}
                onChange={() => patch('visibility', 'shareable' as Visibility)}
              />
              <span>Shareable — OK to include in public PDF exports</span>
            </label>
          </fieldset>
        </form>
      </Modal>
      {confirmDelete && onDelete && (
        <ConfirmDialog
          title={`Delete ${form.number}?`}
          message="This removes the lesson from the year. Sources and themes remain."
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
