# Commonplace Year

A single-year commonplace book editor plugin for [Standard Notes](https://standardnotes.com/). One note = one year. A living chapter in your intellectual autobiography.

[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Standard Notes](https://img.shields.io/badge/Standard%20Notes-editor--editor-086DD6.svg)](https://standardnotes.com/)

**Install URL:** `https://beshoysabri.github.io/sn-commonplace-year/ext.json`

---

## Highlights

- **Bookish, not SaaS.** Serif-forward typography. A year opens with a giant numeral and a letter to your future self, like a chapter in a leather-bound journal.
- **Sources are first-class.** A Source (person, work, tradition) has its own page — not a string on a lesson. Over five years the Carl Jung page becomes a mini-essay on how Jung shaped you.
- **Per-fragment attribution.** A single lesson can fuse Hannibal, Rumi, Kabir, Kierkegaard, and Blavatsky under one theme, and each fragment carries its own attribution.
- **Priority as a property, not a state machine.** Flag a lesson important with one keystroke. Export just your canon.
- **Dates are optional.** Most lessons carry no specific day. Those that do unlock the Calendar view and on-this-day resurfacing.
- **Human-readable storage.** The note body is well-formed Markdown you could edit by hand.
- **Full theme support.** Tracks the active Standard Notes theme via CSS variables, with a dedicated Paper Mode for warm reading.
- **PDF keystone.** Export a properly typeset Book of the Year — front matter, indexes, bibliography.

## Features

### Seven views, one keystroke each
- **Book** — the literary default. Chapter opener, typographic lesson blocks, per-fragment attributions, hair-ruled synthesis, boxed reflections.
- **List** — dense, sortable, groupable, shift-click multi-select with bulk actions.
- **Calendar** — 12-month mini-grid with heatmap intensity, popover per day, undated tray beneath.
- **People** — left sidebar of all sources, right pane is the selected Source's page: biography, reverence, timeline of every citing lesson, co-citations.
- **Themes** — card grid of theme "chapters." Click to expand and review every lesson under the theme.
- **References** — bibliography-style rows for books/articles/lectures. Expand to see every linked lesson.
- **Insights** — six Recharts panels: lessons per month, top sources, theme distribution, priority ratio, cross-pollination pairs.

### Editing
- **LessonModal** — number, title, date, original-language text, multi-fragment body, per-fragment source pickers, theme multi-select with quick-create, reference single-select with quick-create, reflection, visibility.
- **SourceModal / ReferenceModal / ThemeModal** — inline quick-create from LessonModal, or edit standalone with citation-count warnings on delete.
- **YearSummaryModal** — year number, theme-of-the-year, summary, settings (paper mode, number format, auto-numbering).

### On-this-day resurfacing
If today's month+day matches any lesson's date (year-agnostic), a subtle gold banner at the top of the app resurfaces it. Dismissible per session.

### Export
- **PDF** (keystone) — A5 or US Letter, with title page, optional dedication, indexes (people, themes), bibliography, priority-only "canon" mode.
- **Markdown** — canonical (round-trips the @commonplace grammar) or readable (blog-friendly with headings and blockquotes).
- **CSV** — one row per lesson with RFC 4180 quoting.
- **Excel (.xlsx)** — multi-sheet workbook: Cover, Lessons, Sources (with citation counts), References, Themes.

## Tech Stack

| Category | Choice | Version |
| --- | --- | --- |
| Framework | React | 19 |
| Language | TypeScript | 5.9 |
| Build | Vite | 7 |
| IDs | uuid | 13 |
| Charts | Recharts | 3 |
| PDF | jsPDF + jspdf-autotable | 3 / 5 |
| Excel | xlsx | 0.18 |
| Test | Vitest + Testing Library | 3 / 16 |
| Lint | ESLint + typescript-eslint | 9 / 8 |
| Node runtime (CI) | 22 | |
| Styling | Hand-written CSS + CSS variables (no Tailwind, no CSS-in-JS) | |

## Installation

### From URL (easiest)

1. Open Standard Notes → Preferences → Extensions → Install Extension.
2. Paste: `https://beshoysabri.github.io/sn-commonplace-year/ext.json`
3. Create a new note, then change its editor to **Commonplace Year**.

### From Source

```bash
git clone https://github.com/beshoysabri/sn-commonplace-year.git
cd sn-commonplace-year
npm install
npm run dev                     # localhost:5173
# In Standard Notes, install the dev manifest instead:
#   http://localhost:5173/ext.dev.json
```

## Development

Requirements:
- Node 22+
- npm 10+

Scripts:
```bash
npm run dev        # Vite dev server (localhost:5173)
npm run build      # tsc -b && vite build → dist/
npm run lint       # ESLint flat config
npm test           # Vitest run (unit + component)
npm run test:watch # Vitest watch mode
npm run preview    # Preview the production build
```

### Local dev inside Standard Notes

1. `npm run dev`
2. In SN, install `http://localhost:5173/ext.dev.json` as an extension.
3. Open any note and switch its editor to **Commonplace Year (Dev)**.

### Standalone dev (no SN)

Running `npm run dev` and opening `http://localhost:5173/` loads the plugin outside Standard Notes. On first load it seeds sample data (the 23#1–23#5 lessons from `SPEC.md §6`). Changes persist to `localStorage` under `sn-commonplace-year`.

## Deployment

- Push to `main` triggers `.github/workflows/deploy.yml`.
- `npm ci && npm run lint && npm test && npm run build` runs in CI.
- `peaceiris/actions-gh-pages@v4` publishes `dist/` to the `gh-pages` branch, which GitHub Pages serves at the URL in `ext.json`.

## Project Structure

```
src/
├── App.tsx                          # Root — SN bridge, view routing, modal wiring
├── main.tsx
├── styles.css                       # All design tokens + component styles
├── types/commonplace.ts             # All exported types
├── lib/
│   ├── sn-api.ts                    # Standard Notes postMessage bridge
│   ├── markdown.ts                  # parseMarkdown + serializeMarkdown
│   ├── data.ts                      # Factories + createSampleYear + migrateLegacy
│   ├── fragments.ts                 # splitSynthesis + per-fragment helpers
│   ├── colors.ts                    # Palette + hexToRgba + contrastColor
│   ├── dates.ts                     # parseLocalDate + isoWeek + todayIso
│   ├── calendar.ts                  # monthGrid + onThisDayLessons + densestWeek
│   ├── search.ts                    # filterLessons + searchAll
│   ├── stats.ts                     # summaryStats + topSources + co-citations
│   ├── icons.tsx                    # Inline SVG icon set
│   ├── export-md.ts                 # canonical + readable markdown
│   ├── export-csv.ts
│   ├── export-xlsx.ts
│   └── export-pdf.ts                # jsPDF-based typeset Book
└── components/
    ├── Header.tsx                   # Year + theme + view switcher + actions
    ├── ChapterOpener.tsx            # Giant year numeral + summary
    ├── LessonBookEntry.tsx          # Typographic lesson block
    ├── LessonModal.tsx              # Full edit form
    ├── SourceModal.tsx
    ├── ReferenceModal.tsx
    ├── ThemeModal.tsx
    ├── YearSummaryModal.tsx
    ├── ExportDialog.tsx
    ├── OnThisDayBanner.tsx
    ├── lesson/
    │   └── FragmentAttributionEditor.tsx
    ├── views/
    │   ├── BookView.tsx
    │   ├── ListView.tsx
    │   ├── CalendarView.tsx
    │   ├── PeopleView.tsx
    │   ├── ReferencesView.tsx
    │   ├── ThemesView.tsx
    │   └── InsightsView.tsx
    └── shared/
        ├── Modal.tsx
        ├── ConfirmDialog.tsx
        ├── ColorPicker.tsx
        ├── IconPicker.tsx
        ├── ExportMenu.tsx
        ├── SearchBar.tsx
        ├── EmptyState.tsx
        ├── Linkify.tsx
        ├── StatsCard.tsx
        ├── ShortcutsHelp.tsx
        ├── PriorityToggle.tsx
        ├── LessonNumberBadge.tsx
        ├── SourceChip.tsx
        ├── ThemeChip.tsx
        ├── DatePill.tsx
        ├── MultiSelectChips.tsx
        └── SingleSelect.tsx
```

## Data Format

The note body is a small, handwritten-style markdown grammar. Section separator is a line containing only `---`. Order: metadata → themes → sources → references → lessons. Inline attributes use `[key:value]`. Multi-line fields (body, reflection, bodySources, summary) are nested at 2-space indent with content at 4-space indent.

```markdown
@commonplace: year
@version: 1
@year: 2023
@theme: CODE
@numberFormat: YY#N
@defaultView: book
@paperMode: no
@showNumbersInBookView: yes
@autoNumber: yes

@summary:
  A year spent learning that the path reveals itself only to the one
  who walks.

---

@theme: path [color:#6B8E23]
  The path reveals itself to those who walk.

---

@source: Carl Jung [kind:person] [years:1875–1961] [role:analytical psychologist] [color:#7C3AED]
  Foundational influence on shadow, individuation, symbols.

---

@reference: The Road Less Traveled [author:M. Scott Peck] [kind:book] [year:1978] [status:read] [rating:4]

---

@lesson: 23#2
  @important: yes
  @date: 2023-02-14
  @sources: Hannibal, Rumi, Kabir, Søren Kierkegaard, Helena Petrovna Blavatsky
  @themes: path
  @original: AUT VIAM INVENIAM AUT FACIAM
  @originalLanguage: latin
  @visibility: private
  @body:
    "I shall either find a way or make one." /
    Once you start to walk on the way, the way appears. /
    "Wherever you are is the entry point." /
    Above all, keep walking, but by sitting still… /
    You cannot travel on the Path until you become the path itself.
  @bodySources:
    Hannibal
    Rumi
    Kabir
    Søren Kierkegaard
    Helena Petrovna Blavatsky
  @reflection:
    Five voices, one argument. The path is a verb, not a noun.
```

`parseMarkdown(serializeMarkdown(x))` is structurally equal to `x` (modulo regenerated UUIDs, which the markdown intentionally doesn't encode for readability).

## Keyboard Shortcuts

### Views
| Key | Action |
| --- | --- |
| `1` | Book |
| `2` | List |
| `3` | Calendar |
| `4` | People |
| `5` | Themes |
| `6` | References |
| `7` | Insights |

### Create / edit
| Key | Action |
| --- | --- |
| `n` | New lesson |
| `s` | New source |
| `r` | New reference |
| `t` | New theme |
| `e` | Edit year summary / theme-of-year |

### Navigation
| Key | Action |
| --- | --- |
| `/` | Focus search |
| `i` | Toggle important-only filter |
| `p` | Toggle paper mode |
| `j` / `k` | Next / previous lesson in focus |
| `f` | Toggle important on focused lesson |
| `Enter` | Open focused lesson |
| `Esc` | Close modal / clear search |
| `?` | Shortcut overlay |

## Contributing

Issues and PRs welcome. Please:
- Run `npm run lint && npm test && npm run build` before submitting.
- Keep the markdown grammar round-trip invariant: every existing test in `src/lib/markdown.test.ts` must continue to pass.
- If you add a new field to `CommonplaceYear` / `Lesson` / `Source` / `Reference` / `Theme`, update parser, serializer, modal, and export helpers in the same change.

## License

MIT © Beshoy Sabri — see [LICENSE](LICENSE).
