import { forwardRef } from 'react';
import { SearchBar } from './shared/SearchBar';
import {
  BookOpenIcon,
  CalendarIcon,
  DownloadIcon,
  KeyboardIcon,
  MenuIcon,
  PlusIcon,
  QuillIcon,
  SearchIcon,
  StarOutlineIcon,
  StarFilledIcon,
  TagIcon,
  UploadIcon,
  UserSilhouetteIcon,
  InfoIcon,
  BookmarkIcon,
} from '../lib/icons';
import type { ViewMode } from '../types/commonplace';

interface HeaderProps {
  year: number;
  themeLabel?: string;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showImportantOnly: boolean;
  onToggleImportant: () => void;
  paperMode: boolean;
  onTogglePaperMode: () => void;
  onNewLesson: () => void;
  onShowImport: () => void;
  onShowExport: () => void;
  onShowShortcuts: () => void;
  searchRef?: React.Ref<HTMLInputElement>;
  /** Narrow layouts tuck the search field behind a toggle; wide ones always show it. */
  searchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  /** Views that are actually implemented and clickable in this build. */
  enabledViews?: readonly ViewMode[];
}

const VIEW_META: Record<
  ViewMode,
  { label: string; Icon: React.FC<{ size?: number }>; shortcut: string }
> = {
  book:       { label: 'Book',       Icon: BookOpenIcon,        shortcut: '1' },
  list:       { label: 'List',       Icon: MenuIcon,            shortcut: '2' },
  quotes:     { label: 'Quotes',     Icon: QuillIcon,           shortcut: '3' },
  calendar:   { label: 'Calendar',   Icon: CalendarIcon,        shortcut: '4' },
  people:     { label: 'People',     Icon: UserSilhouetteIcon,  shortcut: '5' },
  themes:     { label: 'Themes',     Icon: TagIcon,             shortcut: '6' },
  references: { label: 'References', Icon: BookmarkIcon,        shortcut: '7' },
  insights:   { label: 'Insights',   Icon: InfoIcon,            shortcut: '8' },
};

const ALL_VIEWS: ViewMode[] = [
  'book',
  'list',
  'quotes',
  'calendar',
  'people',
  'themes',
  'references',
  'insights',
];

export const Header = forwardRef<HTMLElement, HeaderProps>(function Header(
  {
    year,
    themeLabel,
    view,
    onViewChange,
    searchQuery,
    onSearchChange,
    showImportantOnly,
    onToggleImportant,
    paperMode,
    onTogglePaperMode,
    onNewLesson,
    onShowImport,
    onShowExport,
    onShowShortcuts,
    searchRef,
    searchOpen,
    onSearchOpenChange,
    enabledViews = ALL_VIEWS,
  },
  ref,
) {
  // A query keeps the field on screen even if the toggle was closed, so an
  // active filter is never hidden.
  const showSearch = searchOpen || searchQuery !== '';

  const toggleSearch = () => {
    if (showSearch) {
      onSearchOpenChange(false);
      if (searchQuery) onSearchChange('');
      return;
    }
    onSearchOpenChange(true);
    // The field is display:none until the open state renders.
    requestAnimationFrame(() => {
      if (searchRef && typeof searchRef === 'object') searchRef.current?.focus();
    });
  };

  return (
    <header className={`cp-header ${showSearch ? 'search-open' : ''}`} ref={ref}>
      <div className="cp-header-identity">
        <span className="cp-header-year">{year}</span>
        {themeLabel && (
          <>
            <span className="cp-header-dot">·</span>
            <span className="cp-header-theme">{themeLabel}</span>
          </>
        )}
      </div>
      <nav className="cp-header-viewswitch" aria-label="Views">
        {ALL_VIEWS.map((v) => {
          const meta = VIEW_META[v];
          const active = v === view;
          const enabled = enabledViews.includes(v);
          return (
            <button
              key={v}
              type="button"
              className={`cp-view-tab ${active ? 'active' : ''} ${!enabled ? 'disabled' : ''}`}
              onClick={() => enabled && onViewChange(v)}
              disabled={!enabled}
              title={`${meta.label} (${meta.shortcut})`}
              aria-label={meta.label}
              aria-pressed={active}
            >
              <meta.Icon size={14} />
              <span className="cp-view-tab-label">{meta.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="cp-header-search">
        <SearchBar
          ref={searchRef}
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search lessons…"
        />
      </div>
      <div className="cp-header-controls">
        <button
          type="button"
          className={`cp-btn cp-btn-ghost cp-btn-icon cp-hdr-search-toggle ${showSearch ? 'active' : ''}`}
          onClick={toggleSearch}
          title={showSearch ? 'Close search' : 'Search (/)'}
          aria-label={showSearch ? 'Close search' : 'Search'}
          aria-expanded={showSearch}
        >
          <SearchIcon size={16} />
        </button>
        <button
          type="button"
          className="cp-btn cp-btn-primary cp-btn-icon cp-hdr-new"
          onClick={onNewLesson}
          title="New lesson (n)"
          aria-label="New lesson"
        >
          <PlusIcon size={14} /> <span className="cp-hdr-new-label">Lesson</span>
        </button>
        <button
          type="button"
          className={`cp-btn cp-btn-ghost cp-btn-icon cp-hdr-important ${showImportantOnly ? 'active' : ''}`}
          onClick={onToggleImportant}
          title={
            showImportantOnly ? 'Showing important only' : 'Show important only'
          }
          aria-label="Important only"
          aria-pressed={showImportantOnly}
        >
          {showImportantOnly ? (
            <StarFilledIcon size={14} />
          ) : (
            <StarOutlineIcon size={14} />
          )}
        </button>
        <button
          type="button"
          className={`cp-btn cp-btn-ghost cp-btn-icon cp-hdr-paper ${paperMode ? 'active' : ''}`}
          onClick={onTogglePaperMode}
          title={paperMode ? 'Paper mode on' : 'Paper mode'}
          aria-label="Paper mode"
          aria-pressed={paperMode}
        >
          <BookOpenIcon size={14} />
        </button>
        <button
          type="button"
          className="cp-btn cp-btn-ghost cp-btn-icon cp-hdr-import"
          onClick={onShowImport}
          title="Import"
          aria-label="Import"
        >
          <UploadIcon size={14} />
        </button>
        <button
          type="button"
          className="cp-btn cp-btn-ghost cp-btn-icon cp-hdr-export"
          onClick={onShowExport}
          title="Export"
          aria-label="Export"
        >
          <DownloadIcon size={14} />
        </button>
        <button
          type="button"
          className="cp-btn cp-btn-ghost cp-btn-icon cp-hdr-shortcuts"
          onClick={onShowShortcuts}
          title="Keyboard shortcuts"
          aria-label="Keyboard shortcuts"
        >
          <KeyboardIcon size={14} />
        </button>
      </div>
    </header>
  );
});
