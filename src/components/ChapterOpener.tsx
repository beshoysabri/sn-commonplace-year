import type { CommonplaceYear } from '../types/commonplace';

interface ChapterOpenerProps {
  data: CommonplaceYear;
}

/**
 * The year's cover page inside Book view. Large year numeral with drop-cap
 * treatment, theme-of-the-year as kicker, and the long-form summary.
 */
export function ChapterOpener({ data }: ChapterOpenerProps) {
  const hasContent = Boolean(data.summary || data.theme);
  return (
    <header className="cp-chapter-opener">
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
      {data.summary && (
        <p className="cp-chapter-summary">{data.summary}</p>
      )}
      {!hasContent && (
        <p className="cp-chapter-placeholder">
          A new chapter awaits. Open the year summary to set the theme and
          write your letter to a future self.
        </p>
      )}
    </header>
  );
}
