// How one exercise of a `WeekPlan` becomes its rows in a session, by exercise type (GT-160, 10.1
// FR-6, FR-9, FR-10). `materializeWeekPlan` lays out the days; what a row of each type holds is
// decided here, one materializer per type, so a type that plans something other than sets is added
// as an entry rather than a branch in the converter.
//
// - strength, power: one bare row per `sets` of the day — reps and loads come later (Flow C's
//   history at Start, the engine for the weeks after).
// - interval: one bare round per `sets` of the day (GT-190) — its rounds are set on the day, as a
//   strength exercise's sets are — with no times. Work and rest come from history, like a set's
//   weight (FR-9, revised 26.10.2026): Flow C's history fills them at Start (GT-185), and with
//   none they stay empty and are picked on the card (GT-187). The cycle's work and rest are no
//   longer copied in — they were the library's defaults, a number that looks set and isn't.
// - mobility: one block, its length likewise left to history (FR-10, FR-9).
//
// The settings are the cycle's own copy (`Mesocycle.exerciseSettings`, GT-158) — the library's
// values only where the cycle has none. A mobility exercise with no settings of its type at all
// falls back to rows by `sets`, as before this existed: a row of the wrong shape is better than a
// day that can't be opened.

import type { ExerciseType } from './catalog';
import type { ExerciseSettings } from './exerciseConfig';
import type { SetTarget } from './execution';
import type { WeekPlanExercise } from './plan';

/** What a materializer is given about one exercise of the plan. */
export type MaterializeInput = {
  entry: WeekPlanExercise;
  settings: ExerciseSettings | undefined;
};

type Materializer = (input: MaterializeInput) => SetTarget[];

/** One bare row per `sets` of the day — strength's and power's, and everyone's before GT-160. */
export function setRows({ entry }: Pick<MaterializeInput, 'entry'>): SetTarget[] {
  return Array.from({ length: entry.sets }, (_, index) => ({ setNumber: index + 1 }));
}

function mobilityBlock(input: MaterializeInput): SetTarget[] {
  const { settings } = input;
  if (settings?.type !== 'mobility') {
    return setRows(input);
  }
  return [{ setNumber: 1 }];
}

const MATERIALIZERS: Record<ExerciseType, Materializer> = {
  strength: setRows,
  power: setRows,
  interval: setRows,
  mobility: mobilityBlock,
};

/** The rows `entry` starts its week with, by the type of its exercise. */
export function materializeSetTargets(type: ExerciseType, input: MaterializeInput): SetTarget[] {
  return MATERIALIZERS[type](input);
}

