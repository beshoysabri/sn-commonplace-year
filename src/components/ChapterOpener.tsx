import type { CommonplaceYear } from '../types/commonplace';
import { EditIcon } from '../lib/icons';

interface ChapterOpenerProps {
  data: CommonplaceYear;
  onEdit?: () => void;
}

/**
 * The year's cover page inside Book view. Large year numeral with drop-cap
 * treatment, theme-of-the-year as kicker, and the long-form summary.
 */
export function ChapterOpener({ data, onEdit }: ChapterOpenerProps) {
  const hasContent = Boolean(data.summary || data.theme);
  return (
    <header className="cp-chapter-opener">
      {onEdit && (
        <button
          type="button"
          className="cp-chapter-edit"
          onClick={onEdit}
          title="Edit year, theme, and summary (e)"
          aria-label="Edit year"
        >
          <EditIcon size={12} />
          <span>Edit</span>
        </button>
      )}
      <div className="cp-chapter-year" aria-label={`Year ${data.year}`}>
        {data.year}
      </div>
      {data.theme && (
        <div className="cp-chapter-kicker">
          <span className="cp-chapter-year-small">{data.year}</span>
          <span className="cp-chapter-dot">·</span>
          <span className="cp-chapter-theme-name">{data.theme}</span>
        </div>
      )}
      {data.summary && <p className="cp-chapter-summary">{data.summary}</p>}
      {!hasContent && onEdit && (
        <button
          type="button"
          className="cp-chapter-placeholder cp-chapter-placeholder-btn"
          onClick={onEdit}
        >
          A new chapter awaits. Click to set the theme and write your letter
          to a future self.
        </button>
      )}
      {!hasContent && !onEdit && (
        <p className="cp-chapter-placeholder">
          A new chapter awaits. Press <kbd>e</kbd> to set the theme and write
          your letter to a future self.
        </p>
      )}
    </header>
  );
}
