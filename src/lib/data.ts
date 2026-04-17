import { v4 as uuid } from 'uuid';
import type {
  CommonplaceYear,
  Lesson,
  Reference,
  Source,
  Theme,
  Visibility,
  SourceKind,
  ReferenceKind,
} from '../types/commonplace';
import { DEFAULT_SETTINGS } from '../types/commonplace';
import { legacyFallback } from './markdown';

function nowIso(): string {
  return new Date().toISOString();
}

export function createEmptyYear(year: number): CommonplaceYear {
  const now = nowIso();
  return {
    version: 1,
    year,
    settings: { ...DEFAULT_SETTINGS },
    lessons: [],
    sources: [],
    references: [],
    themes: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function migrateLegacy(raw: string): CommonplaceYear {
  return legacyFallback(raw);
}

export function createNewLesson(
  number: string,
  overrides: Partial<Lesson> = {},
): Lesson {
  const now = nowIso();
  return {
    id: uuid(),
    number,
    body: '',
    important: false,
    sourceIds: [],
    themeIds: [],
    linkedLessonIds: [],
    visibility: 'private' as Visibility,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createNewSource(
  name: string,
  overrides: Partial<Source> = {},
): Source {
  const now = nowIso();
  return {
    id: uuid(),
    name,
    kind: 'person' as SourceKind,
    color: '#4C6B8A',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createNewReference(
  title: string,
  overrides: Partial<Reference> = {},
): Reference {
  const now = nowIso();
  return {
    id: uuid(),
    title,
    kind: 'book' as ReferenceKind,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createNewTheme(
  name: string,
  overrides: Partial<Theme> = {},
): Theme {
  const now = nowIso();
  return {
    id: uuid(),
    name,
    color: '#6B8E23',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * The canonical sample year used for tests and dev-mode seeding.
 * Reproduces SPEC.md §6 data: 23#1–23#5, 5 sources, 1 reference, 2 themes.
 */
export function createSampleYear(year = 2023): CommonplaceYear {
  const now = nowIso();

  const pathTheme = createNewTheme('path', { color: '#6B8E23' });
  pathTheme.description = 'The path reveals itself to those who walk.';

  const egoTheme = createNewTheme('ego', { color: '#C19A3E' });
  egoTheme.description = 'The paradox of the self that seeks to dissolve itself.';

  const methodTheme = createNewTheme('method', { color: '#4C6B8A' });

  const jung = createNewSource('Carl Jung', {
    lifeYears: '1875–1961',
    role: 'analytical psychologist',
    color: '#7C3AED',
    notes:
      'Swiss psychiatrist. Foundational influence on the way I think about\nshadow, individuation, and symbols.',
  });
  const rumi = createNewSource('Rumi', {
    lifeYears: '1207–1273',
    role: 'Sufi mystic and poet',
    color: '#E5879A',
  });
  const johnson = createNewSource('Samuel Johnson', {
    lifeYears: '1709–1784',
    role: 'essayist',
    color: '#4C6B8A',
  });
  const watts = createNewSource('Alan Watts', {
    lifeYears: '1915–1973',
    role: 'philosopher and interpreter of Zen',
    color: '#2E7D32',
  });
  const merlin = createNewSource('Merlin', {
    role: 'mythic figure',
    color: '#9B2335',
  });
  const hannibal = createNewSource('Hannibal', { color: '#4C6B8A' });
  const kabir = createNewSource('Kabir', { color: '#4C6B8A' });
  const kierkegaard = createNewSource('Søren Kierkegaard', { color: '#4C6B8A' });
  const blavatsky = createNewSource('Helena Petrovna Blavatsky', {
    color: '#4C6B8A',
  });

  const roadLessTraveled = createNewReference('The Road Less Traveled', {
    author: 'M. Scott Peck',
    year: 1978,
    status: 'read',
    rating: 4,
    notes:
      'Read in January. The discipline chapter reframed my relationship to delayed gratification.',
  });

  const lessons: Lesson[] = [
    createNewLesson('23#1', {
      body: '"He who makes a beast of himself gets rid of the pain of being a man."',
      sourceIds: [johnson.id],
    }),
    createNewLesson('23#2', {
      important: true,
      date: `${year}-02-14`,
      sourceIds: [hannibal.id, rumi.id, kabir.id, kierkegaard.id, blavatsky.id],
      bodyAttributions: [
        [hannibal.id],
        [rumi.id],
        [kabir.id],
        [kierkegaard.id],
        [blavatsky.id],
      ],
      themeIds: [pathTheme.id],
      originalText: 'AUT VIAM INVENIAM AUT FACIAM',
      originalLanguage: 'latin',
      body: [
        '"I shall either find a way or make one." /',
        'Once you start to walk on the way, the way appears. /',
        '"Wherever you are is the entry point." /',
        'Above all, keep walking, but by sitting still, and the more one sits still, the closer one comes to feeling ill. Thus if one just keeps on walking, everything will be all right. /',
        'You cannot travel on the Path until you become the path itself.',
      ].join('\n'),
      reflection: 'Five voices, one argument. The path is a verb, not a noun.',
    }),
    createNewLesson('23#3', {
      important: true,
      sourceIds: [jung.id],
      themeIds: [methodTheme.id, egoTheme.id],
      referenceId: roadLessTraveled.id,
      body: '"An ancient adept has said: \'If the wrong man uses the right means, the right means work in the wrong way.\' This Chinese saying, unfortunately only too true, stands in sharp contrast to our belief in the \'right\' method irrespective of the man who applies it. In reality, everything depends on the man and little or nothing on the method."',
    }),
    createNewLesson('23#4', {
      important: true,
      sourceIds: [watts.id],
      themeIds: [egoTheme.id],
      body: 'The biggest ego trip going is getting rid of your ego, and of course the joke of it all is that your ego does not exist.',
    }),
    createNewLesson('23#5', {
      sourceIds: [merlin.id],
      body: '"When you\'re sad, learn something."',
    }),
  ];

  return {
    version: 1,
    year,
    theme: 'CODE',
    summary:
      'A year spent learning that the path reveals itself only to the one who walks. I leaned heavily on Jung and Watts, returned to Rumi after a decade, and found Merlin unexpectedly wise. Theme of the year: CODE — the conviction that how you do anything is how you do everything.',
    settings: { ...DEFAULT_SETTINGS },
    lessons,
    sources: [
      jung,
      rumi,
      johnson,
      watts,
      merlin,
      hannibal,
      kabir,
      kierkegaard,
      blavatsky,
    ],
    references: [roadLessTraveled],
    themes: [pathTheme, egoTheme, methodTheme],
    createdAt: now,
    updatedAt: now,
  };
}
