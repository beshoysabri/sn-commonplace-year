# `sn-commonplace-year` — Claude Code Kickstart Prompt

> A single-year commonplace book editor plugin for Standard Notes.
> One note = one year. A living chapter in the user's intellectual autobiography.

---

## 0. How to use this document

Paste this file into Claude Code at the root of a fresh repo as `SPEC.md` (or `CLAUDE.md`) and run:

```
Please implement the plugin described in SPEC.md. Read this file fully, then follow the
phased implementation order in §15. After every phase, run `npm run build` and `npm run
lint`, fix all errors, then proceed. Reference the three existing sibling plugins in my
GitHub account (beshoysabri/sn-goal-tracker, sn-habit-tracker, sn-kanban-board) for the
established patterns: sn-api.ts, data.ts, shared components, CSS variables, GitHub Actions
deploy workflow, ext.json structure. Reuse those patterns verbatim where they apply.
```

---

## 1. Product Vision

This is not a quote-logger. It is a **commonplace book**: the 400-year-old practice of copying
meaningful passages, distilling themes, and naming the thinkers who shaped the reader's mind.
Locke kept one. Marcus Aurelius' *Meditations* essentially is one. Over decades, it becomes the
user's intellectual autobiography.

The plugin is **scoped to a single year per note**. One Standard Notes note holds one year.
The user typically captures 60–90 lessons per year and flags 36–37 of them as priority/canonical.
A calendar year is a natural chapter — long enough to show an arc, short enough to browse as a book.

Primary users: serious readers, reflective practitioners, philosophically-minded writers.
Design tone: bookish, calm, literary. Serif-forward. No dashboards-first aesthetic. It should
feel like opening a leather-bound journal, not a productivity SaaS.

---

## 2. Non-Negotiable Principles

1. **The quote is not the lesson.** A lesson has a source passage *and* the user's own reflection as two distinct fields. Conflating them is the bug every other tool makes.
2. **Sources are first-class.** A Source (person or work) has its own record and page — not a string on a lesson. Over 5 years, the Source page of Carl Jung becomes a mini-essay on how Jung shaped the user.
3. **Themes cross lessons.** A single lesson can span multiple thinkers (see `23#2` which fuses Hannibal, Rumi, Kabir, Kierkegaard, Blavatsky under a "path" theme). Theme view is a first-class view, not a filter.
4. **Human-readable storage.** Note body is well-formed Markdown the user could read/edit by hand. This follows `sn-kanban-board`'s storage philosophy, not the JSON-in-note approach of the trackers.
5. **Typography matters.** This plugin ships with a serif type stack and a "Book" default view. It must look like prose, not a database.
6. **Priority is a property, not a state machine.** A lesson is either flagged important or not. No three-way "maybe." Users should be able to flag/unflag with a single keystroke.
7. **Dates are optional.** Most lessons carry no specific day. Those that do unlock the Calendar view and "on this day" resurfacing. Undated lessons remain first-class.

---

## 3. Tech Stack

Match the sibling plugins exactly.

| Category | Choice | Version |
| --- | --- | --- |
| Framework | React | 19 |
| Language | TypeScript | 5.9 |
| Build | Vite | 7 |
| IDs | uuid | 13 |
| Charts | Recharts | latest |
| PDF export | jsPDF + jspdf-autotable | latest |
| Excel export | xlsx | latest |
| Lint | ESLint + typescript-eslint | 9 / 8 |
| Node runtime (CI) | 22 |
| Package manager | npm | 10+ |
| Styling | Hand-written CSS with CSS variables (no Tailwind, no CSS-in-JS) |
| UI framework | **None.** Custom primitives only. |

Deploy target: GitHub Pages via `.github/workflows/deploy.yml`, using `peaceiris/actions-gh-pages@v4`
on push to `main`. Output `dist/` + `ext.json` from `public/`.

---

## 4. Design System

### 4.1 Type stack

The defining visual choice of this plugin.

```css
--font-serif: "Iowan Old Style", "Palatino Linotype", Palatino, "Source Serif Pro",
              Georgia, "Times New Roman", serif;
--font-sans:  -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--font-mono:  "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
```

- **Lesson body text**: serif, `1.0625rem`, line-height `1.75`, letter-spacing `0.005em`.
- **UI chrome (headers, buttons, badges)**: sans-serif.
- **Numbers, codes (`23#1`)**: sans-serif, tabular-nums.
- **Originals in Latin/Arabic/Greek**: serif, italic, slightly larger. Translation below in regular serif.
- **Drop cap** for the year number on the Book view chapter opener.

### 4.2 Color variables

All colors must use Standard Notes CSS variables where possible (these auto-adapt to the active SN theme):

```css
--sn-stylekit-background-color
--sn-stylekit-foreground-color
--sn-stylekit-contrast-background-color
--sn-stylekit-contrast-foreground-color
--sn-stylekit-border-color
--sn-stylekit-info-color
--sn-stylekit-success-color
--sn-stylekit-warning-color
--sn-stylekit-danger-color
--sn-stylekit-editor-foreground-color
--sn-stylekit-editor-background-color
```

Plugin-specific colors (used sparingly, only for commonplace-book semantics):

```css
--cp-priority:        #C19A3E;  /* muted gold — for important flag */
--cp-paper:           #FDFBF7;  /* aged-paper tint, optional toggle */
--cp-ink:             #2B2724;  /* deep ink for paper mode */
--cp-margin-rule:     rgba(193, 154, 62, 0.25);
--cp-blockquote-rule: #C19A3E;
```

"Paper mode" is an opt-in toggle that overrides the SN background/foreground for the Book view only,
giving the user a warm reading surface. Off by default; setting is persisted in the note data.

### 4.3 Spacing & layout

- Base unit: `8px`.
- Book view content column: `max-width: 680px`, centered.
- Chapter opener (year summary): `max-width: 560px`.
- Lesson gutter (left margin inside book view): `48px` reserved for lesson number badge.

### 4.4 Iconography

Reuse the existing `icons.tsx` pattern from sibling plugins (inline SVGs, single module).
Add these commonplace-specific icons: `book-open`, `star-filled`, `star-outline`, `quill`,
`bookmark`, `calendar-dot`, `link-chain`, `tag`, `user-silhouette`, `drop-cap`.

---

## 5. Data Model

All types live in `src/types/commonplace.ts`.

```typescript
export type UUID = string;
export type ISODate = string; // "2023-06-15"
export type ISODateTime = string; // "2023-06-15T14:32:00.000Z"

/**
 * The root object serialized into the note body.
 * One CommonplaceYear per note.
 */
export interface CommonplaceYear {
  /** Schema version. Bump on breaking changes. */
  version: 1;

  /** The year this note covers, e.g. 2023. */
  year: number;

  /** Optional one-word theme-of-the-year, e.g. "CODE", "PATH", "SURRENDER". */
  theme?: string;

  /** Long-form chapter opener: user's letter to their future self about this year. */
  summary?: string;

  /** Settings stored in-note so they travel with the data. */
  settings: CommonplaceSettings;

  /** All lessons for the year. */
  lessons: Lesson[];

  /** People and works cited across lessons. First-class entities. */
  sources: Source[];

  /** Bibliography: books, articles, podcasts, conversations the year drew from. */
  references: Reference[];

  /** Controlled vocabulary for themes. Lessons reference by id. */
  themes: Theme[];

  /** Audit trail. */
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface CommonplaceSettings {
  /**
   * Numbering format. Tokens: YY, YYYY, N, NNN.
   * Default: "YY#N" → "23#1", "23#42".
   * Alternatives: "YYYY.N" → "2023.1"; "L-YY-NNN" → "L-23-001".
   */
  numberFormat: string;

  /** Default view when opening the note. */
  defaultView: ViewMode;

  /** Paper mode for Book view. */
  paperMode: boolean;

  /** Whether to show lesson numbers in Book view (some users prefer unobtrusive reading). */
  showNumbersInBookView: boolean;

  /** Autogenerate numbers on create. Otherwise user types them. */
  autoNumber: boolean;
}

export type ViewMode = "book" | "list" | "calendar" | "people" | "themes" | "references" | "insights";

/**
 * The atom of the commonplace book.
 */
export interface Lesson {
  id: UUID;

  /** Display number, e.g. "23#1". Derived from numberFormat but stored for stability. */
  number: string;

  /**
   * The user's one-line distillation in their own words. Optional but highly encouraged —
   * this is what makes a lesson searchable and memorable. Shown as the lesson's title when present.
   * Example: "The path appears only to those who start walking."
   */
  title?: string;

  /**
   * The passage, quote, or primary content. Can be multi-paragraph. May contain the user's
   * own words (self-lesson) or a quoted source, or a synthesis of multiple thinkers.
   * Supports Markdown. Separator convention for multi-source synthesis: " / " between quotes.
   */
  body: string;

  /**
   * Optional original-language version (Latin, Arabic, Greek, Sanskrit, etc.).
   * Displayed italicized above body. E.g. "AUT VIAM INVENIAM AUT FACIAM".
   */
  originalText?: string;
  originalLanguage?: string; // "latin" | "arabic" | "greek" | ... free-form

  /** Optional specific day within the year. Enables Calendar view + on-this-day. */
  date?: ISODate;

  /** Priority flag. True means canonical/important. User typically flags ~40% of lessons. */
  important: boolean;

  /**
   * Sources this lesson cites. References Source.id entries.
   * A single lesson may cite multiple sources (see 23#2 with 5 attributions).
   */
  sourceIds: UUID[];

  /** Themes/tags this lesson belongs to. References Theme.id entries. */
  themeIds: UUID[];

  /** Optional link to a Reference (which book did this come from?). */
  referenceId?: UUID;

  /**
   * The user's own reflection, separate from `body`. Always in first person.
   * Shown distinctly in all views — never blended with the quote.
   */
  reflection?: string;

  /** Cross-references: "this extends 22#11". References other Lesson.ids. */
  linkedLessonIds: UUID[];

  /**
   * "This is mine alone" vs "this I'd share publicly." Affects export filters.
   * Default: "private".
   */
  visibility: "private" | "shareable";

  /** Audit trail. */
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Source {
  id: UUID;

  /** Display name. E.g. "Carl Jung", "Rumi", "My father". */
  name: string;

  /** Life years, if a person. E.g. "1875–1961". Free-form string to allow BCE, "c. 1207", etc. */
  lifeYears?: string;

  /**
   * Role/school. Free-form but encouraged to be tag-like.
   * Examples: "analytical psychologist", "Sufi mystic", "Stoic emperor", "desert father", "self".
   */
  role?: string;

  /**
   * Source type — affects how the Source page renders.
   * - "person": a real human thinker
   * - "collective": a tradition or school (e.g. "The Stoics", "Zen masters")
   * - "self": the user's own realizations (one canonical "self" Source per note)
   * - "conversation": a specific remembered conversation
   * - "experience": a life event that taught the lesson
   */
  kind: "person" | "collective" | "self" | "conversation" | "experience";

  /** Free-form biographical or contextual notes from the user. */
  notes?: string;

  /** Optional avatar/portrait URL or initials. */
  avatarUrl?: string;

  /** Color badge, auto-assigned from palette but user-editable. */
  color: string;

  /** Reverence/rating 1–5 stars. Optional. Shown on the Source page. */
  reverence?: 1 | 2 | 3 | 4 | 5;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Reference {
  id: UUID;

  title: string;

  /** Author string — free-form, allows "Jung & von Franz" etc. */
  author?: string;

  /**
   * What kind of reference this is.
   */
  kind: "book" | "article" | "essay" | "lecture" | "podcast" | "video"
      | "conversation" | "letter" | "film" | "artwork" | "experience" | "other";

  /** Year of publication / occurrence. */
  year?: number;

  /** URL to the full text, podcast episode, etc. */
  url?: string;

  /** Optional cover image URL. */
  coverUrl?: string;

  /** Reading status (for books). */
  status?: "reading" | "read" | "reference" | "abandoned";

  /** Rating 1–5. */
  rating?: 1 | 2 | 3 | 4 | 5;

  /** Free-form notes on the work as a whole. */
  notes?: string;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Theme {
  id: UUID;
  name: string;       // e.g. "path", "ego", "suffering", "method"
  description?: string;
  color: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
```

### 5.1 Derived data

Computed on the fly, never stored:

- **Lessons by source** — for People view. Group by `sourceIds`, sort by number.
- **Lessons by theme** — for Themes view.
- **Lessons by date** — for Calendar view (dated lessons only).
- **Important lessons** — `lessons.filter(l => l.important)`.
- **Orphan themes** — themes referenced by zero lessons.
- **Orphan sources** — sources referenced by zero lessons.

---

## 6. Markdown Storage Format

This is the exact grammar written to the note body. It must be human-readable and hand-editable.
Use a top-level metadata block, then per-entity sections.

```markdown
@commonplace: year
@version: 1
@year: 2023
@theme: CODE
@numberFormat: YY#N
@defaultView: book
@paperMode: false
@showNumbersInBookView: true
@autoNumber: true

@summary:
A year spent learning that the path reveals itself only to the one who walks.
I leaned heavily on Jung and Watts, returned to Rumi after a decade, and found
Merlin unexpectedly wise. Theme of the year: CODE — the conviction that how
you do anything is how you do everything.

---

@theme: path [color:#6B8E23]
  The path reveals itself to those who walk.

@theme: ego [color:#C19A3E]
  The paradox of the self that seeks to dissolve itself.

---

@source: Carl Jung [kind:person] [years:1875–1961] [role:analytical psychologist] [color:#7C3AED]
  Swiss psychiatrist. Foundational influence on the way I think about
  shadow, individuation, and symbols.

@source: Rumi [kind:person] [years:1207–1273] [role:Sufi mystic and poet] [color:#E5879A]

@source: Samuel Johnson [kind:person] [years:1709–1784] [role:essayist] [color:#4C6B8A]

@source: Alan Watts [kind:person] [years:1915–1973] [role:philosopher and interpreter of Zen] [color:#2E7D32]

@source: Merlin [kind:person] [role:mythic figure] [color:#9B2335]

---

@reference: The Road Less Traveled [author:M. Scott Peck] [kind:book] [year:1978] [status:read] [rating:4]
  Read in January. The discipline chapter reframed my relationship to
  delayed gratification.

---

@lesson: 23#1
  @important: no
  @sources: Samuel Johnson
  @themes:
  @body:
    "He who makes a beast of himself gets rid of the pain of being a man."
  @reflection:

@lesson: 23#2
  @important: yes
  @date: 2023-02-14
  @sources: Hannibal, Rumi, Kabir, Søren Kierkegaard, Helena Petrovna Blavatsky
  @themes: path
  @original: AUT VIAM INVENIAM AUT FACIAM
  @originalLanguage: latin
  @body:
    "I shall either find a way or make one." /
    Once you start to walk on the way, the way appears. /
    "Wherever you are is the entry point." /
    Above all, keep walking, but by sitting still, and the more one sits still,
    the closer one comes to feeling ill. Thus if one just keeps on walking,
    everything will be all right. /
    You cannot travel on the Path until you become the path itself.
  @reflection:
    Five voices, one argument. The path is a verb, not a noun.

@lesson: 23#3
  @important: yes
  @sources: Carl Jung
  @themes: method, ego
  @reference: The Road Less Traveled
  @body:
    "An ancient adept has said: 'If the wrong man uses the right means,
    the right means work in the wrong way.' This Chinese saying, unfortunately
    only too true, stands in sharp contrast to our belief in the 'right' method
    irrespective of the man who applies it. In reality, everything depends on
    the man and little or nothing on the method."
  @reflection:

@lesson: 23#4
  @important: yes
  @sources: Alan Watts
  @themes: ego
  @body:
    The biggest ego trip going is getting rid of your ego, and of course
    the joke of it all is that your ego does not exist.

@lesson: 23#5
  @important: no
  @sources: Merlin
  @themes:
  @body:
    "When you're sad, learn something."
```

### 6.1 Grammar rules

- Top metadata: `@key: value` at the very top, before any `---` separator.
- Section separator: a line containing only `---`.
- Section order: metadata → summary → themes → sources → references → lessons.
- Each entity begins with `@<kind>: <identifier>` and optional inline attributes in `[key:value]` form.
- Multi-line body fields use nested `@<field>:` lines at 2-space indent followed by 4-space-indented content.
- Lesson `@sources:` and `@themes:` are comma-separated human-readable names — the parser resolves them to IDs. If a name doesn't match, a new Source/Theme is created on load (permissive parsing).
- Order of lessons within the file is display order. `number` is the logical identifier.
- On save, the file is round-tripped: parse → state → serialize → write. The serialized form is canonical.

### 6.2 Parser/serializer contract

Implemented in `src/lib/markdown.ts`:

```typescript
export function parseMarkdown(raw: string): CommonplaceYear;
export function serializeMarkdown(data: CommonplaceYear): string;
```

Must be inverse: `parseMarkdown(serializeMarkdown(x))` deep-equals `x` modulo `updatedAt`.

Legacy migration: if the note body doesn't start with `@commonplace: year`, attempt a
best-effort import from free-form markdown that looks like the user's screenshot
(bullets with `YY#N` as the first token). Never destroy data — if parsing fails,
surface a "Could not parse" banner with the raw content preserved in a `rawFallback` field.

---

## 7. File Structure

```
sn-commonplace-year/
├── .github/workflows/deploy.yml
├── public/
│   ├── ext.json                 # production manifest
│   └── ext.dev.json             # local dev manifest
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── styles.css               # all styles, CSS variables
│   ├── types/
│   │   └── commonplace.ts
│   ├── lib/
│   │   ├── sn-api.ts            # SN postMessage bridge (copy from sibling)
│   │   ├── markdown.ts          # parse + serialize
│   │   ├── data.ts              # initialization, migration, defaults
│   │   ├── numbering.ts         # format/parse lesson numbers
│   │   ├── stats.ts             # analytics computations
│   │   ├── colors.ts            # palette helpers
│   │   ├── icons.tsx            # SVG icon set
│   │   ├── calendar.ts          # date utilities
│   │   ├── search.ts            # fuzzy search across lessons/sources/references
│   │   ├── export-csv.ts
│   │   ├── export-md.ts
│   │   ├── export-pdf.ts
│   │   └── export-xlsx.ts
│   └── components/
│       ├── CommonplaceApp.tsx   # root — state, routing between views
│       ├── Header.tsx
│       ├── ChapterOpener.tsx    # year + theme + summary header
│       ├── LessonCard.tsx       # card representation used in List + People + Themes
│       ├── LessonBookEntry.tsx  # typographic representation used in Book view
│       ├── LessonModal.tsx      # create/edit
│       ├── SourceModal.tsx
│       ├── ReferenceModal.tsx
│       ├── ThemeModal.tsx
│       ├── YearSummaryModal.tsx # edit year-level metadata
│       ├── Sidebar.tsx          # quick-nav: themes, sources, important
│       ├── views/
│       │   ├── BookView.tsx
│       │   ├── ListView.tsx
│       │   ├── CalendarView.tsx
│       │   ├── PeopleView.tsx
│       │   ├── ThemesView.tsx
│       │   ├── ReferencesView.tsx
│       │   └── InsightsView.tsx
│       └── shared/
│           ├── Modal.tsx
│           ├── ConfirmDialog.tsx
│           ├── ColorPicker.tsx
│           ├── IconPicker.tsx
│           ├── ExportMenu.tsx
│           ├── SearchBar.tsx
│           ├── EmptyState.tsx
│           ├── PriorityToggle.tsx     # star button, used everywhere
│           ├── LessonNumberBadge.tsx  # "23#1" pill
│           ├── SourceChip.tsx         # tappable source pill
│           ├── ThemeChip.tsx
│           ├── DatePill.tsx
│           ├── Linkify.tsx
│           ├── StatsCard.tsx
│           └── ShortcutsHelp.tsx
├── .gitignore
├── LICENSE (MIT)
├── README.md
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 8. Views

All views share a header (year + theme of year + view switcher + search + add button) and optional sidebar.
All views honor active filters: search query, `showImportantOnly`, theme filter, source filter, date range.

### 8.1 Book view — default

The literary experience. This is what the user opens the note to see.

- Single-column layout, max-width 680px, centered.
- Chapter opener at the top: giant year numeral with drop-cap treatment, theme-of-the-year as a kicker ("2023 · CODE"), summary as a long-form paragraph in serif.
- Each lesson rendered as a typographic block:
  - Lesson number in the left margin as a small tabular-nums badge.
  - If `title` present: shown as a serif bold line-of-verse.
  - If `originalText` present: italic, centered, slightly larger, with its language as a small all-caps label beneath.
  - Body rendered as prose. Multi-source synthesis (detected by ` / ` separator) renders each fragment as its own paragraph with a hair-rule between.
  - Sources shown at the bottom right in "— Name / Name / Name" form.
  - If `important`: a subtle gold margin rule (1px, `--cp-priority`) runs down the left side of the entry.
  - If `reflection` present: shown in a boxed note below the body, labeled "— Reflection" in small caps, slightly indented, sans-serif to distinguish user voice from source voice.
  - Click anywhere on the entry: opens LessonModal in edit mode.
  - Priority toggle button visible on hover/focus at the top-right of the entry.
- Paper mode toggle in header: swaps background to `--cp-paper` and text to `--cp-ink` for this view only.
- Keyboard `j`/`k` navigate prev/next lesson; `space` opens focused; `f` toggles important on focused.

### 8.2 List view

Dense, scannable alternative to Book. Ideal for year-end review.

- One row per lesson: number pill, title (or first 80 chars of body), priority star, date pill (if dated), source chips, theme chips.
- Sortable by: number (default), date, important-first, source name, theme.
- Group-by dropdown: none (flat), month (for dated), priority, theme.
- Bulk operations: shift-click to multi-select, then "Mark important" / "Add theme" / "Delete" toolbar appears.

### 8.3 Calendar view

Only shows lessons with a `date`. Undated lessons listed in a "No date" tray beneath.

- 12-month grid (3 rows × 4 columns), each month a small calendar.
- Days with lessons get a dot (gold if any are important, gray otherwise). Day badge shows count if >1.
- Clicking a day: popover lists lessons on that day, each clickable to open modal.
- Hover day: tooltip shows first lesson title.
- "Today" in the current year is subtly highlighted.
- Heatmap intensity corresponds to lesson count — light touch, no overwhelming color.
- Top-of-view summary: "42 of 87 lessons have dates. Densest week: week 24 (5 lessons)."

### 8.4 People view

Sources as first-class citizens. Each Source gets a page.

- Two-pane layout: left sidebar lists all Sources (sortable by name / number of citations / reverence), right pane is the selected Source's page.
- Source page:
  - Large name, life years, role, optional avatar initials.
  - User's notes on the source (editable inline).
  - Reverence stars.
  - Timeline of every lesson citing this source — rendered as compact Book-view entries, chronologically by lesson number.
  - "Also appears with" — chips showing Sources frequently co-cited with this one (from multi-source lessons).
- Empty state when no Source selected: "Select a source to see everything you learned from them this year."

### 8.5 Themes view

- Grid of theme "chapters." Each chapter: theme name, theme color as a band, lesson count.
- Click chapter: expands inline to show all lessons under that theme in compact form.
- Allow theme rename/recolor/delete inline; deleting asks whether to reassign to another theme or untag.
- "Untagged" virtual theme at the end shows lessons with no theme — the to-do list for end-of-year review.

### 8.6 References view

- Bibliography-style layout, each Reference as a row.
- Columns: cover thumbnail (if url), title, author, kind, year, status, rating, lessons-drawn-count.
- Click row: expands to show notes on the work + every lesson linked to it.
- Sort by: author (default), year, status, rating, lesson count.
- Filter by kind.

### 8.7 Insights view

Analytics dashboard, Recharts. Six panels:

1. **Summary cards**: total lessons · important count · untagged count · sources count · references count · dated-lessons count.
2. **Lessons over the year** — line chart, lessons per month (from `createdAt`), with important-lesson count overlaid.
3. **Top sources** — horizontal bar, top 10 Sources by citation count. Bars tinted with source color.
4. **Theme distribution** — donut chart, lessons per theme.
5. **Priority ratio** — simple ratio visual: "37 of 87 lessons marked important (42%)."
6. **Cross-pollination** — co-citation matrix: which pairs of sources most often appear on the same lesson. Top 5 pairs listed.

---

## 9. Keyboard Shortcuts

Implemented in a single `useKeyboard.ts` hook. Help overlay via `?` uses the existing `ShortcutsHelp.tsx` pattern.

| Key | Action |
| --- | --- |
| `1`–`7` | Switch to view by ordinal (1 Book, 2 List, 3 Calendar, 4 People, 5 Themes, 6 References, 7 Insights) |
| `n` | New lesson |
| `s` | New source |
| `r` | New reference |
| `t` | New theme |
| `e` | Edit year summary / theme-of-year |
| `/` | Focus search |
| `i` | Toggle "important only" filter |
| `p` | Toggle paper mode (Book view) |
| `j` / `k` | Next / previous lesson in focus |
| `f` | Toggle important on focused lesson |
| `Enter` | Open focused lesson in modal |
| `Esc` | Close modal / clear search |
| `?` | Show shortcuts help |
| `Cmd/Ctrl + S` | Force-save (SN auto-saves, but this flushes pending edits) |

---

## 10. Priority / Important Flag — Detailed Behavior

The user flags ~40% of lessons as important. This must be frictionless.

- **Storage**: single boolean `important` on each Lesson.
- **Toggle surfaces**: star icon button on LessonCard, LessonBookEntry, LessonModal, and in the multi-select toolbar. Keyboard shortcut `f` when a lesson is focused.
- **Visual treatment**:
  - Star icon filled gold (`--cp-priority`) when important, outline-only when not.
  - Book view: gold margin rule on the left side of the entry.
  - List view: gold star pill at the end of the row.
  - Calendar view: day dot is gold if any important lesson falls that day.
- **Filter**: `showImportantOnly` is a global filter toggle in the header, state is per-session not persisted.
- **Exports**: all exports have a "Priority only" option that filters to important lessons. PDF in priority-only mode produces the user's "Canon of 2023" — a publishable, giftable selection.
- **Insights**: every chart has an "important only" variant toggle.

---

## 11. Date / Day Marking — Detailed Behavior

- **Storage**: optional `date: ISODate` on each Lesson. Must fall within the note's `year`.
- **Entry**: date picker in LessonModal, optional. Can be cleared by a trash icon next to the picker.
- **Display**: compact `DatePill` component — "Feb 14", "Feb 14 · Tue". Only rendered if date present.
- **On-this-day resurfacing**: on load, if today's month/day matches any lesson's month/day (regardless of year within note), show a subtle banner: "On this day: 23#17 · 'When you're sad, learn something.'" Dismissible per session.
- **Calendar view**: entirely driven by dates. See §8.3.
- **Analytics**: "dated lessons" count + "densest week" metric.
- **Export**: dated lessons appear in chronological order in CSV; in Book view PDF, optionally show date as a margin note.

---

## 12. Exports

Four formats. Reuse the `ExportMenu.tsx` pattern from sibling plugins.

### 12.1 Markdown (`.md`)

Round-trip of the storage format, or optionally a "readable" variant that strips metadata tags and produces something bloggable. User picks which in the export dialog.

### 12.2 CSV (`.csv`)

One row per lesson. Columns: `number, title, date, important, sources, themes, reference, original, body, reflection, linkedLessons, visibility, createdAt`.

### 12.3 Excel (`.xlsx`)

Multi-sheet workbook: Lessons, Sources (with citation counts), References, Themes, Summary. First sheet is a cover with year, theme, summary, totals.

### 12.4 PDF (`.pdf`) — the keystone export

Produce a properly typeset "Book of [Year]." Use jsPDF.

- **Size**: A5 default, US Letter option.
- **Typography**: serif throughout (embed a serif font via jsPDF's standard fonts or custom).
- **Front matter**: title page ("The Commonplace Book of 2023 · CODE"), dedication line (optional user field in export dialog), table of contents (by theme or by number, user choice).
- **Body**: one lesson per section. Lesson number as a running header. Important lessons get a gold hairline rule in the left margin (render as a 0.5pt gray line — gold doesn't always print well).
- **Back matter**: People index (alphabetical, with page references), Theme index, References/Bibliography in a proper citation format.
- **Options dialog**:
  - Scope: All lessons / Important only / By theme / By source.
  - Include reflections: yes/no.
  - Include summary: yes/no.
  - Include indexes: yes/no.
  - Paper size: A5 / Letter.
- **Filename**: `commonplace-YYYY[-important].pdf`.

---

## 13. Standard Notes Integration

Copy `sn-api.ts` from `sn-kanban-board` verbatim — the postMessage bridge is already battle-tested.

Key behaviors:

- On mount: request current note content, parse, hydrate state. If parse fails, render a "Could not parse this note as a commonplace book" panel with a button "Initialize a new commonplace book for [current year from Date.now]" and the raw content preserved below so nothing is lost.
- On state change (debounced 400ms): serialize and write back.
- Full theme support via CSS variables (see §4.2).
- Standalone dev mode: when not inside SN, apply a dark fallback theme and seed with sample data from the screenshot (the 23#1–23#5 lessons) so the developer sees something real immediately.
- `ext.json` manifest: area = `editor-editor`, name = "Commonplace Year", description = "A commonplace book editor for Standard Notes — one year per note." Include a permissions array allowing read/write of the note's text content.

---

## 14. README.md

Write a README that matches the sibling-plugins' voice: badges for MIT/TypeScript/React/Standard Notes, Quick Install URL, Highlights bullet list, Features by section, Tech Stack table, Installation (From URL + From Source), Development (prereqs, scripts, local dev with SN), Deployment (GitHub Pages + Actions), Project Structure, Data Format (the markdown grammar), Keyboard Shortcuts table, Contributing, License.

---

## 15. Phased Implementation

Execute in order. After each phase: `npm run build && npm run lint`, fix everything, commit.

### Phase 1 — Scaffolding (foundational)
- Vite + React 19 + TS project, matching sibling configs exactly.
- `public/ext.json` + `public/ext.dev.json`.
- `.github/workflows/deploy.yml`.
- Empty `App.tsx` rendering "Hello, commonplace."
- ESLint config matching siblings.
- CSS variable base in `styles.css`.

### Phase 2 — Types & storage
- Implement all types in `types/commonplace.ts`.
- Implement `lib/markdown.ts` parser + serializer with round-trip tests (write a small inline test harness if no test framework is set up; prefer zero dev dependencies).
- Implement `lib/data.ts` with `createEmptyYear(year: number)` and `migrateLegacy(raw: string)`.
- Implement `lib/sn-api.ts` bridge.
- Get parse → state → serialize working end-to-end with a hardcoded sample (the 23#1–23#5 lessons from §6).

### Phase 3 — Shared components
- Modal, ConfirmDialog, ColorPicker, IconPicker, ExportMenu, SearchBar, EmptyState, Linkify, StatsCard, ShortcutsHelp.
- PriorityToggle, LessonNumberBadge, SourceChip, ThemeChip, DatePill.

### Phase 4 — Book view (ship one complete view before moving on)
- `ChapterOpener`, `LessonBookEntry`, `BookView`.
- Paper mode toggle.
- Keyboard navigation `j/k/space/f`.
- Verify the visual experience with the sample data matches the literary intent. **This phase is the taste test.** Do not proceed until Book view is beautiful.

### Phase 5 — List view + LessonModal
- `ListView` with sort, group-by, bulk select.
- `LessonModal` full create/edit flow with all fields.
- Search across lessons.
- Filter: important-only.

### Phase 6 — Sources, References, Themes
- `SourceModal`, `ReferenceModal`, `ThemeModal`.
- `PeopleView` with Source pages.
- `ReferencesView`.
- `ThemesView`.

### Phase 7 — Calendar view + on-this-day
- `CalendarView`.
- On-this-day banner logic.
- Undated-lessons tray.

### Phase 8 — Insights view
- Stats module in `lib/stats.ts`.
- All six panels.

### Phase 9 — Exports
- Markdown (round-trip + readable variant).
- CSV.
- XLSX.
- PDF — the keystone. Do the typography carefully.

### Phase 10 — Polish
- Responsive / mobile drawer sidebar (match sibling pattern).
- Empty states throughout.
- Year Summary Modal (`e` shortcut).
- On-this-day refinement.
- Paper mode polish.
- README.md.
- First `ext.json` ships.

---

## 16. Acceptance Criteria

A release candidate must satisfy all of the following:

- [ ] Opens a Standard Notes note, parses an existing commonplace-book-formatted body, renders the Book view by default.
- [ ] Creates a new commonplace book when the note is empty: prompts "Which year?" and seeds with minimal scaffold.
- [ ] Handles the exact sample content from §6 round-trip: parse → serialize produces semantically equivalent output.
- [ ] All seven views (Book, List, Calendar, People, Themes, References, Insights) render without errors.
- [ ] Priority star can be toggled from Book, List, Modal, and via `f` key.
- [ ] A lesson can carry multiple sources (the `23#2` case with 5 attributions), correctly displayed in Book view, correctly indexed in People view.
- [ ] Date on a lesson places it correctly in Calendar view.
- [ ] On-this-day banner appears when today's month/day matches a lesson's date.
- [ ] Search across lessons, sources, themes, references works in < 100ms for 500 lessons.
- [ ] All four exports produce valid files. PDF opens in Preview/Acrobat without warnings.
- [ ] Full theme support: plugin works in SN's Default, Dark, Autobiography, and Futura themes without visual breakage. Respects `prefers-color-scheme` in standalone mode.
- [ ] Mobile (≤ 768px) layout works: sidebar becomes drawer, Book view remains readable, modals become bottom sheets.
- [ ] Keyboard shortcuts help overlay lists every shortcut. `?` opens it from any view.
- [ ] Deploy workflow builds on push to `main` and publishes `ext.json` to GitHub Pages.
- [ ] `npm run build` and `npm run lint` both exit 0 with no warnings.
- [ ] README.md is complete and matches the sibling-plugin voice.

---

## 17. Out of Scope (explicit non-goals for v1)

- **Multi-year aggregation.** This plugin is scoped to one year per note. Cross-year views belong to a future `sn-commonplace-hub` meta-plugin. Do not build a "all years" view.
- **Sync/collaboration.** Data lives in a single SN note.
- **AI features.** No summarization, no suggestion, no embedding. A commonplace book is a deliberate practice; automation undermines it.
- **Images inside lessons.** Text-first. Cover images on References are the only image field.
- **Audio/video attachments.**
- **Public sharing from the plugin.** Users export a PDF and share that manually.

---

## 18. Nice-to-haves to defer to v1.1

- EPUB export.
- Multi-language typography (right-to-left rendering for Arabic originals).
- Theme-of-the-year badges / custom accent color per note.
- Reading-mode animation: flip-through-pages for Book view on desktop.
- "This reminds me of..." inline suggestions based on shared themes.

---

## 19. Decisions recorded

1. **Deploy branch**: `main` (matching sibling plugins).
2. **PDF font**: start with jsPDF's standard "times"; defer EB Garamond embedding to v1.1.
3. **Testing**: Vitest with full unit coverage for lib/ functions; markdown round-trip invariant covered by dedicated test suite. UI components tested via React Testing Library where practical.
4. **ext.json**: match kanban-board's superset of fields (identifier, name, content_type, area, version, description, url, download_url, latest_url, marketing_url, thumbnail_url).

---

*End of specification. Implement top-to-bottom, confirming at phase boundaries.*
