export type UUID = string;
export type ISODate = string;
export type ISODateTime = string;

export type ViewMode =
  | 'book'
  | 'list'
  | 'calendar'
  | 'people'
  | 'themes'
  | 'references'
  | 'insights';

export type SourceKind =
  | 'person'
  | 'collective'
  | 'self'
  | 'conversation'
  | 'experience';

export type ReferenceKind =
  | 'book'
  | 'article'
  | 'essay'
  | 'lecture'
  | 'podcast'
  | 'video'
  | 'conversation'
  | 'letter'
  | 'film'
  | 'artwork'
  | 'experience'
  | 'other';

export type ReferenceStatus = 'reading' | 'read' | 'reference' | 'abandoned';
export type Rating = 1 | 2 | 3 | 4 | 5;
export type Visibility = 'private' | 'shareable';

export interface CommonplaceSettings {
  numberFormat: string;
  defaultView: ViewMode;
  paperMode: boolean;
  showNumbersInBookView: boolean;
  autoNumber: boolean;
}

export interface Lesson {
  id: UUID;
  number: string;
  title?: string;
  body: string;
  originalText?: string;
  originalLanguage?: string;
  date?: ISODate;
  important: boolean;
  /**
   * The union of all sources cited anywhere in this lesson. Used for
   * People-view indexing and the flat "— Name / Name" footer attribution
   * when `bodyAttributions` is absent.
   */
  sourceIds: UUID[];
  /**
   * Optional per-fragment attribution. Index `i` maps to the i-th fragment
   * of `body` split on " / ". Each entry is a UUID list (a single fragment
   * can still cite multiple sources). When set, Book view renders a
   * "— Name" after each fragment and omits the lesson-level footer
   * attribution to avoid duplication.
   */
  bodyAttributions?: UUID[][];
  themeIds: UUID[];
  referenceId?: UUID;
  reflection?: string;
  linkedLessonIds: UUID[];
  visibility: Visibility;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Source {
  id: UUID;
  name: string;
  lifeYears?: string;
  role?: string;
  kind: SourceKind;
  notes?: string;
  avatarUrl?: string;
  color: string;
  reverence?: Rating;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Reference {
  id: UUID;
  title: string;
  author?: string;
  kind: ReferenceKind;
  year?: number;
  url?: string;
  coverUrl?: string;
  status?: ReferenceStatus;
  rating?: Rating;
  notes?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Theme {
  id: UUID;
  name: string;
  description?: string;
  color: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface CommonplaceYear {
  version: 1;
  year: number;
  theme?: string;
  summary?: string;
  settings: CommonplaceSettings;
  lessons: Lesson[];
  sources: Source[];
  references: Reference[];
  themes: Theme[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  /** Present only when parsing failed; preserves original note body so data isn't destroyed. */
  rawFallback?: string;
}

export const DEFAULT_SETTINGS: CommonplaceSettings = {
  numberFormat: 'YY#N',
  defaultView: 'book',
  paperMode: false,
  showNumbersInBookView: true,
  autoNumber: true,
};

export const SOURCE_KINDS: readonly SourceKind[] = [
  'person',
  'collective',
  'self',
  'conversation',
  'experience',
] as const;

export const REFERENCE_KINDS: readonly ReferenceKind[] = [
  'book',
  'article',
  'essay',
  'lecture',
  'podcast',
  'video',
  'conversation',
  'letter',
  'film',
  'artwork',
  'experience',
  'other',
] as const;

export const REFERENCE_STATUSES: readonly ReferenceStatus[] = [
  'reading',
  'read',
  'reference',
  'abandoned',
] as const;

export const VIEW_MODES: readonly ViewMode[] = [
  'book',
  'list',
  'calendar',
  'people',
  'themes',
  'references',
  'insights',
] as const;
