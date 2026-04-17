import { forwardRef } from 'react';
import { SearchBar } from './shared/SearchBar';
import {
  BookOpenIcon,
  CalendarIcon,
  DownloadIcon,
  KeyboardIcon,
  MenuIcon,
  PlusIcon,
  StarOutlineIcon,
  StarFilledIcon,
  TagIcon,
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
  onShowExport: () => void;
  onShowShortcuts: () => void;
  searchRef?: React.Ref<HTMLInputElement>;
  /** Views that are actually implemented and clickable in this build. */
  enabledViews?: readonly ViewMode[];
}

const VIEW_META: Record<
  ViewMode,
  { label: string; Icon: React.FC<{ size?: number }>; shortcut: string }
> = {
  book:       { label: 'Book',       Icon: BookOpenIcon,        shortcut: '1' },
  list:       { label: 'List',       Icon: MenuIcon,            shortcut: '2' },
  calendar:   { label: 'Calendar',   Icon: CalendarIcon,        shortcut: '3' },
  people:     { label: 'People',     Icon: UserSilhouetteIcon,  shortcut: '4' },
  themes:     { label: 'Themes',     Icon: TagIcon,             shortcut: '5' },
  references: { label: 'References', Icon: BookmarkIcon,        shortcut: '6' },
  insights:   { label: 'Insights',   Icon: InfoIcon,            shortcut: '7' },
};

const ALL_VIEWS: ViewMode[] = [
  'book',
  'list',
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
    onShowExport,
    onShowShortcuts,
    searchRef,
    enabledViews = ALL_VIEWS,
  },
  ref,
) {
  return (
    <header className="cp-header" ref={ref}>
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
              aria-pressed={active}
            >
              <meta.Icon size={14} />
              <span className="cp-view-tab-label">{meta.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="cp-header-controls">
        <div className="cp-header-search">
          <SearchBar
            ref={searchRef}
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search lessons…"
          />
        </div>
        <button
          type="button"
          className="cp-btn cp-btn-primary cp-btn-icon"
          onClick={onNewLesson}
          title="New lesson (n)"
        >
          <PlusIcon size={14} /> Lesson
        </button>
        <button
          type="button"
          className={`cp-btn cp-btn-ghost cp-btn-icon ${showImportantOnly ? 'active' : ''}`}
          onClick={onToggleImportant}
          title={
            showImportantOnly ? 'Showing important only' : 'Show important only'
          }
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
          className={`cp-btn cp-btn-ghost cp-btn-icon ${paperMode ? 'active' : ''}`}
          onClick={onTogglePaperMode}
          title={paperMode ? 'Paper mode on' : 'Paper mode'}
          aria-pressed={paperMode}
        >
          <BookOpenIcon size={14} />
        </button>
        <button
          type="button"
          className="cp-btn cp-btn-ghost cp-btn-icon"
          onClick={onShowExport}
          title="Export"
        >
          <DownloadIcon size={14} />
        </button>
        <button
          type="button"
          className="cp-btn cp-btn-ghost cp-btn-icon"
          onClick={onShowShortcuts}
          title="Keyboard shortcuts"
        >
          <KeyboardIcon size={14} />
        </button>
      </div>
    </header>
  );
});
