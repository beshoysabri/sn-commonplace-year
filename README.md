# Commonplace Year for Standard Notes

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Standard Notes](https://img.shields.io/badge/Standard%20Notes-Plugin-086DD6.svg)](https://standardnotes.com/)

A serif-forward commonplace book editor plugin for [Standard Notes](https://standardnotes.com/). One note = one year. A living chapter in your intellectual autobiography — quotes, reflections, and the people who shaped your year, gathered into a book you'd actually want to read.

### Quick Install

Paste this URL in **Standard Notes > Preferences > Advanced Settings > Install Custom Plugin**:

```
https://beshoysabri.github.io/sn-commonplace-year/ext.json
```

### Highlights

- **8 Views** — Book, List, Quotes, Calendar, People, Themes, References, Insights
- **Sources as first-class pages** — not tags. The Carl Jung page becomes a mini-essay over years.
- **Per-fragment attribution** — one lesson can fuse Hannibal, Rumi, Kabir, Kierkegaard under one theme, each fragment with its own source.
- **Bookish typography** — giant year numeral, typeset lesson blocks, hair-rule reflections, optional warm Paper Mode.
- **PDF keystone** — export a properly typeset Book of the Year: title page, indexes, bibliography.
- **Human-readable storage** — the note body is markdown you could edit by hand.
- **Full SN theme support** — tracks the active Standard Notes theme via CSS variables.
- **Mobile ready** — responsive down to iPhone 16 widths.

---

## Features

### Eight Interactive Views

| View | Description |
|------|-------------|
| **Book** | The literary default. Chapter opener, typographic lesson blocks, per-fragment attributions, hair-ruled synthesis, boxed reflections. |
| **List** | Dense, sortable, groupable. Shift-click multi-select with bulk actions. |
| **Quotes** | Pure quote stream, sorted by lesson / date / source / length. Strips away every other affordance so the voices carry. |
| **Calendar** | 12-month mini-grid with heatmap intensity, popover per day, undated tray beneath. |
| **People** | Left sidebar of every source. Right pane is the source's own page — biography, reverence, timeline of every citing lesson, co-citations. |
| **Themes** | Card grid of theme "chapters." Expand to review every lesson under a theme. |
| **References** | Bibliography rows for books, articles, lectures. Expand to see every linked lesson. |
| **Insights** | Six Recharts panels: lessons per month, top sources, theme distribution, priority ratio, cross-pollination pairs. |

### Lessons

- Number (auto or manual), optional title, optional date, multi-fragment body
- Per-fragment source attribution (one lesson, many voices)
- Original-language text (Latin, Sanskrit, Chinese — whatever it came in)
- Reflection paragraph
- Priority flag — mark important with one keystroke, export just your canon
- Theme multi-select + single reference, both with quick-create from the lesson form

### Sources, References, Themes

Three independent entity types, each with its own modal and color palette:

| Entity | Examples | Page |
|--------|----------|------|
| **Source** | Carl Jung, Lao Tzu, a Latin proverb, a Sufi tradition | People view — biography, timeline of lessons, co-citations |
| **Reference** | _The Road Less Traveled_, a specific lecture, an essay | References view — bibliographic row, every linked lesson |
| **Theme** | "path", "ego", "method" | Themes view — expandable chapter card |

All three support inline quick-create from within the LessonModal — no context switch to add a new voice.

### Bullet-list Importer

Paste an existing bullet-list commonplace into the import dialog and it parses straight into a year:

- `YEAR|THEME` header, `- YY#NN` lesson markers
- Single- and multi-bullet lesson bodies
- Per-fragment attribution (detects `A / B / C` body matched to `Author A / Author B / Author C`)
- Append (with suffix collisions) or Replace modes
- Live preview of detected lessons, sources, and per-fragment counts

### On-this-day Resurfacing

If today's month+day matches any lesson's date (year-agnostic), a subtle gold banner at the top of the app resurfaces it. Dismissible per session.

### Export

| Format | Notes |
|--------|-------|
| **PDF** | The keystone. A5 or US Letter, title page, optional dedication, people/theme indexes, bibliography, priority-only "canon" mode. |
| **Markdown** | Canonical (round-trips the `@commonplace` grammar) or readable (blog-friendly with headings and blockquotes). |
| **CSV** | One row per lesson with RFC 4180 quoting. |
| **Excel (.xlsx)** | Multi-sheet workbook: Cover, Lessons, Sources (with citation counts), References, Themes. |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1`–`8` | Jump to view (Book, List, Quotes, Calendar, People, Themes, References, Insights) |
| `n` | New lesson |
| `s` / `r` / `t` | New source / reference / theme |
| `e` | Edit year summary |
| `/` | Focus search |
| `i` | Toggle important-only filter |
| `p` | Toggle paper mode |
| `j` / `k` | Next / previous lesson in focus |
| `f` | Toggle important on focused lesson |
| `Enter` | Open focused lesson |
| `Esc` | Close modal / clear search |
| `?` | Shortcut overlay |

### Standard Notes Integration

- Full theme support — automatically adapts to any SN theme (light or dark)
- Data persists as human-readable markdown inside your SN note
- Works on desktop, web, and mobile SN clients
- Offline fallback via `localStorage` when running standalone
- Paper Mode — opt-in warm parchment surface for Book view, independent of SN theme

### Mobile Support

- Responsive layout tested to iPhone 16 (420px) widths
- Header restructures into a three-row stack on narrow screens
- Touch-friendly targets; bottom-sheet modals
- People view stacks sidebar on top instead of side-by-side

---

## Installation

### From URL (Recommended)

1. Open **Standard Notes**
2. Go to **Preferences** > **General** > **Advanced Settings** > **Install Custom Plugin**
3. Paste:
   ```
   https://beshoysabri.github.io/sn-commonplace-year/ext.json
   ```
4. Click **Install**
5. Open any note, switch its editor to **Commonplace Year**.

### From Source

1. Clone and build (see Development below)
2. Deploy the `dist/` folder to any static host
3. Update `public/ext.json` with your hosted URL
4. Install using your custom `ext.json` URL

---

## Tech Stack

| Technology | Purpose |
|---|---|
| [React](https://react.dev/) 19 | UI framework |
| [TypeScript](https://www.typescriptlang.org/) 5.9 | Type safety |
| [Vite](https://vite.dev/) 7 | Build tool and dev server |
| [Recharts](https://recharts.org/) 3 | Insights view charts |
| [jsPDF](https://github.com/parallax/jsPDF) 3 + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) 5 | Typeset Book PDF export |
| [xlsx](https://github.com/SheetJS/sheetjs) 0.18 | Excel export |
| [uuid](https://github.com/uuidjs/uuid) 13 | ID generation |
| [Vitest](https://vitest.dev/) 3 + [Testing Library](https://testing-library.com/) 16 | Unit and component tests |

Hand-written CSS with CSS variables — no Tailwind, no CSS-in-JS.

---

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- npm 10+

### Setup

```bash
git clone https://github.com/beshoysabri/sn-commonplace-year.git
cd sn-commonplace-year
npm install
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server at `http://localhost:5173` |
| `npm run build` | `tsc -b && vite build` → writes to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint (flat config) |
| `npm test` | Vitest run (unit + component) |
| `npm run test:watch` | Vitest watch mode |

### Local Development with Standard Notes

1. `npm run dev` (starts at `http://localhost:5173`)
2. In SN, install the dev manifest:
   ```
   http://localhost:5173/ext.dev.json
   ```
3. Open any note and switch its editor to **Commonplace Year (Dev)**
4. Changes hot-reload instantly in the SN editor pane

### Standalone Dev (no SN)

Opening `http://localhost:5173/` loads the plugin outside Standard Notes. On first load it seeds sample data (the 23#1–23#5 lessons from `SPEC.md §6`). Changes persist to `localStorage` under `sn-commonplace-year`.

---

## Deployment

The repo includes a GitHub Actions workflow that automatically builds and deploys to GitHub Pages on every push to `main`.

- `.github/workflows/deploy.yml` runs `npm ci && npm run lint && npm test && npm run build`
- `peaceiris/actions-gh-pages@v4` publishes `dist/` to the `gh-pages` branch
- GitHub Pages serves the result at the URL in `public/ext.json`

Bump `version` in `package.json`, `public/ext.json`, and `public/ext.dev.json` together so SN invalidates its cached bundle on upgrade.

---

## Data Format

The note body is a small, handwritten-style markdown grammar. Section separator is a line containing only `---`. Inline attributes use `[key:value]`. Multi-line fields are nested at 2-space indent with content at 4-space indent.

```markdown
@commonplace: year
@version: 1
@year: 2023
@theme: CODE
@defaultView: book

@summary:
  A year spent learning that the path reveals itself only to the one
  who walks.

---

@theme: path [color:#62866C]
  The path reveals itself to those who walk.

---

@source: Carl Jung [kind:person] [years:1875–1961] [role:analytical psychologist] [color:#8C7DA8]

---

@reference: The Road Less Traveled [author:M. Scott Peck] [kind:book] [year:1978]

---

@lesson: 23#2
  @important: yes
  @date: 2023-02-14
  @sources: Hannibal, Rumi, Kabir, Søren Kierkegaard
  @themes: path
  @original: AUT VIAM INVENIAM AUT FACIAM
  @originalLanguage: latin
  @body:
    "I shall either find a way or make one." /
    Once you start to walk on the way, the way appears. /
    "Wherever you are is the entry point." /
    Above all, keep walking, but by sitting still…
  @bodySources:
    Hannibal
    Rumi
    Kabir
    Søren Kierkegaard
  @reflection:
    Four voices, one argument. The path is a verb, not a noun.
```

`parseMarkdown(serializeMarkdown(x))` is structurally equal to `x` (modulo regenerated UUIDs, which the markdown intentionally doesn't encode for readability).

---

## Project Structure

```
src/
  components/
    Header.tsx                  # Year + theme + view switcher + actions
    ChapterOpener.tsx           # Giant year numeral + summary
    LessonBookEntry.tsx         # Typographic lesson block
    LessonModal.tsx             # Full edit form
    SourceModal.tsx
    ReferenceModal.tsx
    ThemeModal.tsx
    YearSummaryModal.tsx
    ExportDialog.tsx
    ImportDialog.tsx            # Bullet-list importer
    OnThisDayBanner.tsx
    views/
      BookView.tsx
      ListView.tsx
      QuotesView.tsx
      CalendarView.tsx
      PeopleView.tsx
      ThemesView.tsx
      ReferencesView.tsx
      InsightsView.tsx
    shared/                     # Reusable UI (Modal, ColorPicker, chips…)
    lesson/
      FragmentAttributionEditor.tsx
  lib/
    sn-api.ts                   # Standard Notes postMessage bridge
    markdown.ts                 # parseMarkdown + serializeMarkdown
    import.ts                   # Bullet-list parser
    data.ts                     # Factories + createSampleYear
    fragments.ts                # splitSynthesis + per-fragment helpers
    colors.ts                   # 18-color shared palette + hex helpers
    dates.ts                    # parseLocalDate + isoWeek + todayIso
    calendar.ts                 # monthGrid + onThisDayLessons
    search.ts                   # filterLessons + searchAll
    stats.ts                    # summaryStats + topSources + co-citations
    export-md.ts                # canonical + readable markdown
    export-csv.ts
    export-xlsx.ts
    export-pdf.ts               # jsPDF-based typeset Book
    icons.tsx                   # Inline SVG icon set
  types/
    commonplace.ts              # All exported types
  styles.css                    # All design tokens + component styles
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Run `npm run lint && npm test && npm run build` before submitting
4. Keep the markdown grammar round-trip invariant — every existing test in `src/lib/markdown.test.ts` must continue to pass
5. If you add a new field to `CommonplaceYear` / `Lesson` / `Source` / `Reference` / `Theme`, update parser, serializer, modal, and export helpers in the same change
6. Open a Pull Request

---

## License

MIT © Beshoy Sabri — see [LICENSE](LICENSE).
