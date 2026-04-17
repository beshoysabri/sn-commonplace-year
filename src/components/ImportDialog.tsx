import { useMemo, useState } from 'react';
import type {
  CommonplaceYear,
  Lesson,
  Source,
  UUID,
} from '../types/commonplace';
import { Modal } from './shared/Modal';
import { ConfirmDialog } from './shared/ConfirmDialog';
import { parseBulletImport, type ImportResult } from '../lib/import';
import { createNewLesson, createNewSource } from '../lib/data';
import { colorFromString } from '../lib/colors';
import { InfoIcon } from '../lib/icons';

interface ImportDialogProps {
  data: CommonplaceYear;
  onApply: (next: CommonplaceYear) => void;
  onClose: () => void;
}

type Mode = 'append' | 'replace';

export function ImportDialog({ data, onApply, onClose }: ImportDialogProps) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<Mode>('append');
  const [adoptYearMeta, setAdoptYearMeta] = useState(true);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const parsed: ImportResult = useMemo(
    () => parseBulletImport(text),
    [text],
  );

  const stats = useMemo(() => {
    const sourceNames = new Set<string>();
    let perFragmentLessons = 0;
    for (const l of parsed.lessons) {
      for (const n of l.sourceNames) sourceNames.add(n);
      if (l.bodyAttributionNames) perFragmentLessons += 1;
    }
    return {
      lessons: parsed.lessons.length,
      sources: sourceNames.size,
      perFragmentLessons,
    };
  }, [parsed]);

  const yearConflict =
    parsed.year !== undefined && parsed.year !== data.year;
  const isReplace = mode === 'replace';

  const handleImport = () => {
    if (isReplace && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    const next = applyImport(data, parsed, mode, adoptYearMeta);
    onApply(next);
    onClose();
  };

  const footer = (
    <div className="cp-modal-footer-actions">
      <div className="cp-modal-footer-spacer" />
      <button type="button" className="cp-btn cp-btn-ghost" onClick={onClose}>
        Cancel
      </button>
      <button
        type="button"
        className="cp-btn cp-btn-primary"
        onClick={handleImport}
        disabled={parsed.lessons.length === 0}
      >
        {isReplace
          ? `Replace year with ${parsed.lessons.length} lesson${parsed.lessons.length === 1 ? '' : 's'}`
          : `Append ${parsed.lessons.length} lesson${parsed.lessons.length === 1 ? '' : 's'}`}
      </button>
    </div>
  );

  return (
    <>
      <Modal title="Import lessons" size="lg" onClose={onClose} footer={footer}>
        <div className="cp-lesson-form">
          <label className="cp-form-field">
            <span className="cp-form-label">
              Paste bullet-list markdown (YEAR|THEME header optional)
            </span>
            <textarea
              className="cp-textarea cp-textarea-mono"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              placeholder={`2024|CODE\n\n- 24#01\n\t- "Quote text"\n\t  — Author\n- 24#02\n\t- Fragment one /\n\t  Fragment two\n\t  — Source A / Source B`}
              spellCheck={false}
            />
          </label>

          {text.trim() && (
            <div className="cp-import-preview">
              <header className="cp-import-preview-head">
                <strong>Preview</strong>
                {parsed.year && (
                  <span className="cp-import-meta">
                    Year detected: <strong>{parsed.year}</strong>
                  </span>
                )}
                {parsed.theme && (
                  <span className="cp-import-meta">
                    Theme: <strong>{parsed.theme}</strong>
                  </span>
                )}
              </header>
              <div className="cp-import-stats">
                <span><strong>{stats.lessons}</strong> lessons</span>
                <span><strong>{stats.sources}</strong> unique sources</span>
                <span>
                  <strong>{stats.perFragmentLessons}</strong> with per-fragment
                  attribution
                </span>
              </div>
              {parsed.warnings.length > 0 && (
                <ul className="cp-import-warnings">
                  {parsed.warnings.map((w, i) => (
                    <li key={i}>
                      <InfoIcon size={12} /> {w}
                    </li>
                  ))}
                </ul>
              )}
              {parsed.lessons.length > 0 && (
                <details className="cp-import-numbers">
                  <summary>
                    Lesson numbers ({parsed.lessons.length})
                  </summary>
                  <code>
                    {parsed.lessons.map((l) => l.number).join(', ')}
                  </code>
                </details>
              )}
            </div>
          )}

          <fieldset className="cp-form-field">
            <legend className="cp-form-label">Mode</legend>
            <label className="cp-form-radio">
              <input
                type="radio"
                name="import-mode"
                checked={mode === 'append'}
                onChange={() => setMode('append')}
              />
              <span>
                <strong>Append</strong> — add to your current year. Lesson
                numbers that conflict get suffixed with <code>-2</code>.
              </span>
            </label>
            <label className="cp-form-radio">
              <input
                type="radio"
                name="import-mode"
                checked={mode === 'replace'}
                onChange={() => setMode('replace')}
              />
              <span>
                <strong>Replace</strong> — wipe the current year's lessons,
                sources, and themes; keep references untouched.
              </span>
            </label>
          </fieldset>

          {yearConflict && (
            <label className="cp-form-radio">
              <input
                type="checkbox"
                checked={adoptYearMeta}
                onChange={(e) => setAdoptYearMeta(e.target.checked)}
              />
              <span>
                Set year to <strong>{parsed.year}</strong>
                {parsed.theme ? (
                  <>
                    {' '}and theme to <strong>{parsed.theme}</strong>
                  </>
                ) : null}{' '}
                (currently <strong>{data.year}</strong>
                {data.theme ? ` · ${data.theme}` : ''})
              </span>
            </label>
          )}
        </div>
      </Modal>
      {confirmReplace && (
        <ConfirmDialog
          title="Replace this year?"
          message={`This wipes ${data.lessons.length} existing lesson${data.lessons.length === 1 ? '' : 's'}, ${data.sources.length} source${data.sources.length === 1 ? '' : 's'}, and ${data.themes.length} theme${data.themes.length === 1 ? '' : 's'}, and replaces them with ${parsed.lessons.length} imported lessons. References are preserved.`}
          confirmLabel="Replace"
          destructive
          onConfirm={() => {
            const next = applyImport(data, parsed, 'replace', adoptYearMeta);
            onApply(next);
            setConfirmReplace(false);
            onClose();
          }}
          onCancel={() => setConfirmReplace(false)}
        />
      )}
    </>
  );
}

/**
 * Pure transformation: produce the next CommonplaceYear after applying
 * the import. No side effects (no toasts, no setters).
 */
function applyImport(
  data: CommonplaceYear,
  parsed: ImportResult,
  mode: Mode,
  adoptYearMeta: boolean,
): CommonplaceYear {
  const now = new Date().toISOString();

  // Base shape — either keep current state (append) or wipe lessons +
  // sources + themes (replace). References are kept either way so the
  // user doesn't lose curated bibliography entries.
  const base: CommonplaceYear =
    mode === 'replace'
      ? {
          ...data,
          lessons: [],
          sources: [],
          themes: [],
          updatedAt: now,
        }
      : { ...data, updatedAt: now };

  if (adoptYearMeta) {
    if (parsed.year !== undefined) base.year = parsed.year;
    if (parsed.theme !== undefined) base.theme = parsed.theme;
  }

  // Source registry: name → Source. Reuses existing ones in append mode
  // so duplicates collapse.
  const sourcesByName = new Map<string, Source>();
  for (const s of base.sources) sourcesByName.set(s.name, s);

  const ensureSource = (name: string): UUID => {
    const existing = sourcesByName.get(name);
    if (existing) return existing.id;
    const s = createNewSource(name, { color: colorFromString(name) });
    sourcesByName.set(name, s);
    base.sources = [...base.sources, s];
    return s.id;
  };

  // Existing lesson-number set for collision avoidance.
  const usedNumbers = new Set(base.lessons.map((l) => l.number));
  const dedupeNumber = (n: string): string => {
    if (!usedNumbers.has(n)) return n;
    let i = 2;
    while (usedNumbers.has(`${n}-${i}`)) i += 1;
    return `${n}-${i}`;
  };

  const newLessons: Lesson[] = parsed.lessons.map((il) => {
    const number = dedupeNumber(il.number);
    usedNumbers.add(number);
    const sourceIds = il.sourceNames.map(ensureSource);
    const bodyAttributions = il.bodyAttributionNames?.map((names) =>
      names.map(ensureSource),
    );
    const lesson: Lesson = createNewLesson(number, {
      body: il.body,
      sourceIds,
      ...(bodyAttributions ? { bodyAttributions } : {}),
    });
    // ensure imported lesson sourceIds union covers any per-fragment
    // sources that weren't on the lesson-level line
    if (bodyAttributions) {
      for (const ids of bodyAttributions) {
        for (const id of ids) {
          if (!lesson.sourceIds.includes(id)) lesson.sourceIds.push(id);
        }
      }
    }
    return lesson;
  });

  base.lessons = [...base.lessons, ...newLessons];
  // Themes and references arrays keep their identity unless we wiped above.
  return base;
}

