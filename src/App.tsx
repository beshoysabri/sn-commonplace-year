import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { snApi } from './lib/sn-api';
import { parseMarkdown, serializeMarkdown } from './lib/markdown';
import {
  createEmptyYear,
  createNewLesson,
  createNewReference,
  createNewSource,
  createNewTheme,
  createSampleYear,
} from './lib/data';
import type {
  CommonplaceYear,
  Lesson,
  Reference,
  Source,
  Theme,
  ViewMode,
} from './types/commonplace';
import { BookView } from './components/views/BookView';
import { ListView } from './components/views/ListView';
import { QuotesView } from './components/views/QuotesView';
import { PeopleView } from './components/views/PeopleView';
import { ReferencesView } from './components/views/ReferencesView';
import { ThemesView } from './components/views/ThemesView';
import { CalendarView } from './components/views/CalendarView';
// Recharts is ~400KB; lazy-load the Insights view so the main bundle stays
// under the 500KB Vite chunk-size warning threshold.
const InsightsView = lazy(() =>
  import('./components/views/InsightsView').then((m) => ({ default: m.InsightsView })),
);
import { Header } from './components/Header';
import { ShortcutsHelp } from './components/shared/ShortcutsHelp';
import { LessonModal, type DataPatches } from './components/LessonModal';
import { SourceModal } from './components/SourceModal';
import { ReferenceModal } from './components/ReferenceModal';
import { ThemeModal } from './components/ThemeModal';
import { OnThisDayBanner } from './components/OnThisDayBanner';
import { onThisDayLessons } from './lib/calendar';
import { ExportDialog } from './components/ExportDialog';
import { YearSummaryModal } from './components/YearSummaryModal';

const INSIDE_SN =
  typeof window !== 'undefined' && window.parent !== window;

const IMPLEMENTED_VIEWS: readonly ViewMode[] = [
  'book',
  'list',
  'quotes',
  'calendar',
  'people',
  'themes',
  'references',
  'insights',
] as const;

function loadStandaloneInitialData(): CommonplaceYear {
  try {
    const saved =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('sn-commonplace-year')
        : null;
    if (saved && saved.trim()) return parseMarkdown(saved);
  } catch {
    // fall through to sample
  }
  return createSampleYear();
}

function App() {
  const [data, setData] = useState<CommonplaceYear>(() =>
    INSIDE_SN
      ? createEmptyYear(new Date().getFullYear())
      : loadStandaloneInitialData(),
  );
  const [loaded, setLoaded] = useState<boolean>(!INSIDE_SN);
  const [view, setView] = useState<ViewMode>('book');
  const [showImportantOnly, setShowImportantOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showYearSummary, setShowYearSummary] = useState(false);
  const [otdDismissed, setOtdDismissed] = useState(false);

  const [editingLesson, setEditingLesson] = useState<{
    lesson: Lesson;
    isNew: boolean;
  } | null>(null);
  const [editingSource, setEditingSource] = useState<{
    source: Source;
    isNew: boolean;
  } | null>(null);
  const [editingReference, setEditingReference] = useState<{
    reference: Reference;
    isNew: boolean;
  } | null>(null);
  const [editingTheme, setEditingTheme] = useState<{
    theme: Theme;
    isNew: boolean;
  } | null>(null);

  const paperMode = data.settings.paperMode;

  const dataReceived = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!INSIDE_SN) return;
    document.body.classList.add('sn-embedded');
    const timeout = setTimeout(() => {
      if (!dataReceived.current) setLoaded(true);
    }, 4000);

    snApi.initialize((text: string) => {
      dataReceived.current = true;
      clearTimeout(timeout);
      const parsed = text.trim()
        ? parseMarkdown(text)
        : createEmptyYear(new Date().getFullYear());
      setData(parsed);
      setView(parsed.settings.defaultView);
      setLoaded(true);
    });

    return () => {
      clearTimeout(timeout);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      document.body.classList.remove('sn-embedded');
      snApi.destroy();
    };
  }, []);

  const persist = useCallback((next: CommonplaceYear) => {
    const md = serializeMarkdown(next);
    if (INSIDE_SN) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        snApi.saveText(md);
        saveTimeoutRef.current = null;
      }, 300);
    } else {
      localStorage.setItem('sn-commonplace-year', md);
    }
  }, []);

  const handleChange = useCallback(
    (next: CommonplaceYear) => {
      const bumped: CommonplaceYear = {
        ...next,
        updatedAt: new Date().toISOString(),
      };
      setData(bumped);
      persist(bumped);
    },
    [persist],
  );

  const togglePaperMode = useCallback(() => {
    setData((prev) => {
      const next: CommonplaceYear = {
        ...prev,
        settings: { ...prev.settings, paperMode: !prev.settings.paperMode },
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  // --- Lesson modal wiring ---

  const nextLessonNumber = useMemo(() => {
    const yy = data.year % 100;
    let maxIndex = 0;
    for (const l of data.lessons) {
      const m = l.number.match(/(\d+)[^0-9]+(\d+)/);
      if (!m) continue;
      const idx = Number(m[2]);
      if (Number(m[1]) === yy && Number.isFinite(idx) && idx > maxIndex) {
        maxIndex = idx;
      }
    }
    return `${yy}#${maxIndex + 1}`;
  }, [data.year, data.lessons]);

  const openNewLesson = useCallback(() => {
    setEditingLesson({ lesson: createNewLesson(nextLessonNumber), isNew: true });
  }, [nextLessonNumber]);

  const openNewSource = useCallback(() => {
    setEditingSource({ source: createNewSource(''), isNew: true });
  }, []);

  const openNewReference = useCallback(() => {
    setEditingReference({
      reference: createNewReference(''),
      isNew: true,
    });
  }, []);

  const openNewTheme = useCallback(() => {
    setEditingTheme({ theme: createNewTheme(''), isNew: true });
  }, []);

  const handleLessonSave = useCallback(
    (updated: Lesson, patches: DataPatches) => {
      setData((prev) => {
        const merged: CommonplaceYear = {
          ...prev,
          sources: [...prev.sources, ...patches.newSources],
          themes: [...prev.themes, ...patches.newThemes],
          references: [...prev.references, ...patches.newReferences],
          updatedAt: new Date().toISOString(),
        };
        const existingIdx = prev.lessons.findIndex((l) => l.id === updated.id);
        if (existingIdx >= 0) {
          merged.lessons = prev.lessons.map((l) =>
            l.id === updated.id ? updated : l,
          );
        } else {
          merged.lessons = [...prev.lessons, updated];
        }
        persist(merged);
        return merged;
      });
    },
    [persist],
  );

  const handleLessonDelete = useCallback(
    (lessonId: string) => {
      setData((prev) => {
        const next: CommonplaceYear = {
          ...prev,
          lessons: prev.lessons.filter((l) => l.id !== lessonId),
          updatedAt: new Date().toISOString(),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const handleSourceSave = useCallback(
    (updated: Source, isNew: boolean) => {
      setData((prev) => {
        const next: CommonplaceYear = {
          ...prev,
          sources: isNew
            ? [...prev.sources, updated]
            : prev.sources.map((s) => (s.id === updated.id ? updated : s)),
          updatedAt: new Date().toISOString(),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const handleSourceDelete = useCallback(
    (sourceId: string) => {
      setData((prev) => {
        const next: CommonplaceYear = {
          ...prev,
          sources: prev.sources.filter((s) => s.id !== sourceId),
          lessons: prev.lessons.map((l) => ({
            ...l,
            sourceIds: l.sourceIds.filter((id) => id !== sourceId),
            bodyAttributions: l.bodyAttributions?.map((ids) =>
              ids.filter((id) => id !== sourceId),
            ),
          })),
          updatedAt: new Date().toISOString(),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const handleReferenceSave = useCallback(
    (updated: Reference, isNew: boolean) => {
      setData((prev) => {
        const next: CommonplaceYear = {
          ...prev,
          references: isNew
            ? [...prev.references, updated]
            : prev.references.map((r) => (r.id === updated.id ? updated : r)),
          updatedAt: new Date().toISOString(),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const handleReferenceDelete = useCallback(
    (refId: string) => {
      setData((prev) => {
        const next: CommonplaceYear = {
          ...prev,
          references: prev.references.filter((r) => r.id !== refId),
          lessons: prev.lessons.map((l) => ({
            ...l,
            referenceIds: l.referenceIds.filter((id) => id !== refId),
          })),
          updatedAt: new Date().toISOString(),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const handleThemeSave = useCallback(
    (updated: Theme, isNew: boolean) => {
      setData((prev) => {
        const next: CommonplaceYear = {
          ...prev,
          themes: isNew
            ? [...prev.themes, updated]
            : prev.themes.map((t) => (t.id === updated.id ? updated : t)),
          updatedAt: new Date().toISOString(),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const handleThemeDelete = useCallback(
    (themeId: string) => {
      setData((prev) => {
        const next: CommonplaceYear = {
          ...prev,
          themes: prev.themes.filter((t) => t.id !== themeId),
          lessons: prev.lessons.map((l) => ({
            ...l,
            themeIds: l.themeIds.filter((id) => id !== themeId),
          })),
          updatedAt: new Date().toISOString(),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const anyModalOpen =
    !!editingLesson ||
    !!editingSource ||
    !!editingReference ||
    !!editingTheme;

  // Global keyboard shortcuts.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const typing =
        tag === 'input' || tag === 'textarea' || target?.isContentEditable;

      if (e.key === 'Escape') {
        if (showShortcuts) {
          setShowShortcuts(false);
          e.preventDefault();
          return;
        }
        if (showExport) {
          setShowExport(false);
          e.preventDefault();
          return;
        }
        if (showYearSummary) {
          setShowYearSummary(false);
          e.preventDefault();
          return;
        }
        if (editingLesson) {
          setEditingLesson(null);
          e.preventDefault();
          return;
        }
        if (editingSource) {
          setEditingSource(null);
          e.preventDefault();
          return;
        }
        if (editingReference) {
          setEditingReference(null);
          e.preventDefault();
          return;
        }
        if (editingTheme) {
          setEditingTheme(null);
          e.preventDefault();
          return;
        }
        if (searchQuery && typing) {
          setSearchQuery('');
          e.preventDefault();
          return;
        }
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (anyModalOpen || showExport || showYearSummary) return;

      switch (e.key) {
        case '/':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case 'i':
          e.preventDefault();
          setShowImportantOnly((v) => !v);
          break;
        case 'p':
          e.preventDefault();
          togglePaperMode();
          break;
        case '?':
          e.preventDefault();
          setShowShortcuts((v) => !v);
          break;
        case 'n':
          e.preventDefault();
          openNewLesson();
          break;
        case 's':
          e.preventDefault();
          openNewSource();
          break;
        case 'r':
          e.preventDefault();
          openNewReference();
          break;
        case 't':
          e.preventDefault();
          openNewTheme();
          break;
        case 'e':
          e.preventDefault();
          setShowYearSummary(true);
          break;
        case '1':
          e.preventDefault();
          setView('book');
          break;
        case '2':
          e.preventDefault();
          setView('list');
          break;
        case '3':
          e.preventDefault();
          setView('quotes');
          break;
        case '4':
          e.preventDefault();
          setView('calendar');
          break;
        case '5':
          e.preventDefault();
          setView('people');
          break;
        case '6':
          e.preventDefault();
          setView('themes');
          break;
        case '7':
          e.preventDefault();
          setView('references');
          break;
        case '8':
          e.preventDefault();
          setView('insights');
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    showShortcuts,
    showExport,
    showYearSummary,
    editingLesson,
    editingSource,
    editingReference,
    editingTheme,
    searchQuery,
    togglePaperMode,
    openNewLesson,
    openNewSource,
    openNewReference,
    openNewTheme,
    anyModalOpen,
  ]);

  if (!loaded) {
    return (
      <div className="app">
        <div className="cp-loading">Loading…</div>
      </div>
    );
  }

  // Citation counts for confirm-delete messaging.
  const sourceCitationCount = (sourceId: string): number =>
    data.lessons.filter((l) => l.sourceIds.includes(sourceId)).length;
  const refCitationCount = (refId: string): number =>
    data.lessons.filter((l) => l.referenceIds.includes(refId)).length;
  const themeCitationCount = (themeId: string): number =>
    data.lessons.filter((l) => l.themeIds.includes(themeId)).length;

  return (
    <div className={`app ${paperMode ? 'cp-paper-mode' : ''}`}>
      <Header
        year={data.year}
        themeLabel={data.theme}
        view={view}
        onViewChange={setView}
        enabledViews={IMPLEMENTED_VIEWS}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showImportantOnly={showImportantOnly}
        onToggleImportant={() => setShowImportantOnly((v) => !v)}
        paperMode={paperMode}
        onTogglePaperMode={togglePaperMode}
        onNewLesson={openNewLesson}
        onShowExport={() => setShowExport(true)}
        onShowShortcuts={() => setShowShortcuts(true)}
        searchRef={searchInputRef}
      />
      {!otdDismissed && (
        <OnThisDayBanner
          lessons={onThisDayLessons(data.lessons)}
          onOpenLesson={(l) =>
            setEditingLesson({ lesson: l, isNew: false })
          }
          onDismiss={() => setOtdDismissed(true)}
        />
      )}
      {view === 'book' && (
        <BookView
          data={data}
          onChange={handleChange}
          onOpenLesson={(l) => setEditingLesson({ lesson: l, isNew: false })}
          onEditYear={() => setShowYearSummary(true)}
          paperMode={paperMode}
          showImportantOnly={showImportantOnly}
          searchQuery={searchQuery}
        />
      )}
      {view === 'list' && (
        <ListView
          data={data}
          onChange={handleChange}
          onOpenLesson={(l) => setEditingLesson({ lesson: l, isNew: false })}
          showImportantOnly={showImportantOnly}
          searchQuery={searchQuery}
        />
      )}
      {view === 'quotes' && (
        <QuotesView
          data={data}
          onChange={handleChange}
          onOpenLesson={(l) => setEditingLesson({ lesson: l, isNew: false })}
          showImportantOnly={showImportantOnly}
          searchQuery={searchQuery}
        />
      )}
      {view === 'calendar' && (
        <CalendarView
          data={data}
          onOpenLesson={(l) => setEditingLesson({ lesson: l, isNew: false })}
          showImportantOnly={showImportantOnly}
          searchQuery={searchQuery}
        />
      )}
      {view === 'people' && (
        <PeopleView
          data={data}
          onOpenLesson={(l) => setEditingLesson({ lesson: l, isNew: false })}
          onOpenSource={(s) => setEditingSource({ source: s, isNew: false })}
          onNewSource={openNewSource}
        />
      )}
      {view === 'themes' && (
        <ThemesView
          data={data}
          onOpenLesson={(l) => setEditingLesson({ lesson: l, isNew: false })}
          onOpenTheme={(t) => setEditingTheme({ theme: t, isNew: false })}
          onNewTheme={openNewTheme}
        />
      )}
      {view === 'references' && (
        <ReferencesView
          data={data}
          onOpenLesson={(l) => setEditingLesson({ lesson: l, isNew: false })}
          onOpenReference={(r) =>
            setEditingReference({ reference: r, isNew: false })
          }
          onNewReference={openNewReference}
        />
      )}
      {view === 'insights' && (
        <Suspense
          fallback={<div className="cp-loading">Loading insights…</div>}
        >
          <InsightsView data={data} />
        </Suspense>
      )}
      {showShortcuts && (
        <ShortcutsHelp onClose={() => setShowShortcuts(false)} />
      )}
      {showExport && (
        <ExportDialog data={data} onClose={() => setShowExport(false)} />
      )}
      {showYearSummary && (
        <YearSummaryModal
          data={data}
          onSave={(patch) => {
            handleChange({ ...data, ...patch });
          }}
          onClose={() => setShowYearSummary(false)}
        />
      )}
      {editingLesson && (
        <LessonModal
          lesson={editingLesson.lesson}
          data={data}
          isNew={editingLesson.isNew}
          onSave={handleLessonSave}
          onDelete={
            editingLesson.isNew
              ? undefined
              : () => handleLessonDelete(editingLesson.lesson.id)
          }
          onClose={() => setEditingLesson(null)}
        />
      )}
      {editingSource && (
        <SourceModal
          source={editingSource.source}
          isNew={editingSource.isNew}
          citationCount={
            editingSource.isNew ? 0 : sourceCitationCount(editingSource.source.id)
          }
          onSave={(s) => handleSourceSave(s, editingSource.isNew)}
          onDelete={
            editingSource.isNew
              ? undefined
              : () => handleSourceDelete(editingSource.source.id)
          }
          onClose={() => setEditingSource(null)}
        />
      )}
      {editingReference && (
        <ReferenceModal
          reference={editingReference.reference}
          isNew={editingReference.isNew}
          citationCount={
            editingReference.isNew
              ? 0
              : refCitationCount(editingReference.reference.id)
          }
          onSave={(r) => handleReferenceSave(r, editingReference.isNew)}
          onDelete={
            editingReference.isNew
              ? undefined
              : () => handleReferenceDelete(editingReference.reference.id)
          }
          onClose={() => setEditingReference(null)}
        />
      )}
      {editingTheme && (
        <ThemeModal
          theme={editingTheme.theme}
          isNew={editingTheme.isNew}
          citationCount={
            editingTheme.isNew ? 0 : themeCitationCount(editingTheme.theme.id)
          }
          onSave={(t) => handleThemeSave(t, editingTheme.isNew)}
          onDelete={
            editingTheme.isNew
              ? undefined
              : () => handleThemeDelete(editingTheme.theme.id)
          }
          onClose={() => setEditingTheme(null)}
        />
      )}
    </div>
  );
}

export default App;
