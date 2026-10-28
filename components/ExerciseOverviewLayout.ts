// What the Overview tab of the Exercise screen is made of, by exercise type (08.6, GT-195; canvas
// "Hybro · Hybrid exercises (10.1)", frames 4.5–4.9). The screen renders whatever list this hands
// it and knows nothing about types: a new type is one more entry in `OVERVIEW_BY_TYPE`, not an
// edit to ExerciseDetailScreen.tsx.
//
// Every type shares the frame — the tiles, or the framed empty state when nothing is logged yet,
// then `How to perform`. What a type adds is which tiles it has and the sections of its own
// (power's and timed work's `Settings`, GT-196/197), which come after `How to perform`.

import type { Exercise, ExerciseType } from '@domain/catalog';
import { exerciseTypeOf } from '@domain/exerciseConfigBuilders';
import type { ExerciseOverviewStats } from '@domain/exerciseOverview';

import { powerLoadOf } from './ExerciseDetailScreenLogic';

/** One tile of the row (08.6, "Определение плиток"). */
export type OverviewTile = 'bestSet' | 'sessions' | 'lastDone';

/**
 * A section a type puts after the shared ones. `settings`: how the exercise is set up in the
 * library, read-only (10.1 FR-1, FR-9) — see `exerciseSettings`.
 */
export type OverviewTypeSection = 'settings';

export type OverviewSection =
  | { kind: 'tiles'; tiles: readonly OverviewTile[] }
  | { kind: 'empty'; title: string }
  | { kind: 'howTo' }
  | { kind: OverviewTypeSection };

type OverviewByType = {
  tiles: readonly OverviewTile[];
  sections: readonly OverviewTypeSection[];
  /** What the empty state says is missing — the type's own unit. */
  emptyTitle: string;
};

const NO_SETS = 'No sets logged yet';

const OVERVIEW_BY_TYPE: Record<ExerciseType, OverviewByType> = {
  // Canvas 4.5: three tiles and How to perform, no Settings — strength has nothing to configure.
  strength: { tiles: ['bestSet', 'sessions', 'lastDone'], sections: [], emptyTitle: NO_SETS },
  // Canvas 4.6: the strength tiles, then the load it is set up with (GT-196).
  power: {
    tiles: ['bestSet', 'sessions', 'lastDone'],
    sections: ['settings'],
    emptyTitle: NO_SETS,
  },
  // Canvas 4.8. Rounds, not sets: a best set means nothing here (10.1 FR-12), and no other tile
  // took its place (Artem, 28.10.2026). Then the lever it progresses by (GT-197).
  interval: {
    tiles: ['sessions', 'lastDone'],
    sections: ['settings'],
    emptyTitle: 'No rounds logged yet',
  },
  mobility: { tiles: ['sessions', 'lastDone'], sections: [], emptyTitle: NO_SETS },
};

/**
 * The Overview's sections, top to bottom. `stats` is `null` when nothing was ever logged: the
 * tiles give way to the empty state, and everything else stays — How to perform and a type's
 * settings are there from the moment the exercise exists.
 */
export function overviewSections(
  exercise: Pick<Exercise, 'type' | 'config'>,
  stats: ExerciseOverviewStats | null,
): OverviewSection[] {
  const layout = OVERVIEW_BY_TYPE[exerciseTypeOf(exercise)];
  // A power exercise with no load logs reps alone: there is no weight to rank a set by, so it
  // drops Best set the way an interval does (Artem, 28.10.2026).
  const tiles =
    powerLoadOf(exercise) === 'none'
      ? layout.tiles.filter((tile) => tile !== 'bestSet')
      : layout.tiles;
  return [
    stats === null ? { kind: 'empty', title: layout.emptyTitle } : { kind: 'tiles', tiles },
    { kind: 'howTo' },
    ...layout.sections.map((kind) => ({ kind })),
  ];
}

/** The empty state's line for this exercise's type — the same on both tabs. */
export function emptyTitleOf(exercise: Pick<Exercise, 'type'>): string {
  return OVERVIEW_BY_TYPE[exerciseTypeOf(exercise)].emptyTitle;
}
