import type { CommonplaceYear, Source, UUID } from '../../types/commonplace';
import { splitSynthesis } from '../../lib/fragments';
import { MultiSelectChips, type MultiSelectOption } from '../shared/MultiSelectChips';

interface FragmentAttributionEditorProps {
  body: string;
  sources: Source[];
  bodyAttributions?: UUID[][];
  onChange: (next: UUID[][] | undefined) => void;
  onCreateSource: (name: string) => string;
  data: CommonplaceYear;
}

/**
 * Shows each fragment of the body (split on " / ") and lets the user pick
 * which Sources that fragment attributes to. If every fragment ends up
 * empty, we pass `undefined` up to clear the bodyAttributions field.
 */
export function FragmentAttributionEditor({
  body,
  sources,
  bodyAttributions,
  onChange,
  onCreateSource,
}: FragmentAttributionEditorProps) {
  const fragments = splitSynthesis(body);
  if (fragments.length < 2) return null;

  // Normalize the attributions to match fragment count.
  const current: UUID[][] = fragments.map(
    (_, i) => bodyAttributions?.[i] ?? [],
  );

  const options: MultiSelectOption[] = sources.map((s) => ({
    id: s.id,
    label: s.name,
    hint: s.role,
    color: s.color,
  }));

  const setFragmentAttribution = (idx: number, ids: UUID[]) => {
    const next = current.map((arr, i) => (i === idx ? ids : arr));
    const anyNonEmpty = next.some((arr) => arr.length > 0);
    onChange(anyNonEmpty ? next : undefined);
  };

  return (
    <div className="cp-fragment-editor">
      <div className="cp-fragment-editor-label">
        <span>Per-fragment attribution</span>
        <span className="cp-fragment-editor-hint">
          {fragments.length} fragment{fragments.length === 1 ? '' : 's'} detected
        </span>
      </div>
      <ul className="cp-fragment-editor-list">
        {fragments.map((text, idx) => (
          <li key={idx} className="cp-fragment-editor-item">
            <div className="cp-fragment-editor-index">{idx + 1}</div>
            <div className="cp-fragment-editor-fields">
              <p className="cp-fragment-editor-text">{text}</p>
              <MultiSelectChips
                options={options}
                selectedIds={current[idx] ?? []}
                onChange={(ids) => setFragmentAttribution(idx, ids)}
                onCreate={onCreateSource}
                placeholder="Who said this? (optional)"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
