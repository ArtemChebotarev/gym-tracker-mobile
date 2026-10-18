// How one exercise of a `WeekPlan` becomes its rows in a session, by exercise type (GT-160, 10.1
// FR-6, FR-9, FR-10). `materializeWeekPlan` lays out the days; what a row of each type holds is
// decided here, one materializer per type, so a type that plans something other than sets is added
// as an entry rather than a branch in the converter.
//
// - strength, power: one bare row per `sets` of the day — reps and loads come later (Flow C's
//   history at Start, the engine for the weeks after).
// - interval: the cycle's rounds, each with the cycle's work time and the rest after it. N rounds
//   have N−1 rests (FR-6): the last round has none.
// - mobility: one block of the cycle's length (FR-10).
//
// The settings are the cycle's own copy (`Mesocycle.exerciseSettings`, GT-158) — the library's
// values only where the cycle has none. An interval or mobility exercise with no settings of the
// right type at all falls back to rows by `sets`, as before this existed: a row of the wrong shape
// is better than a day that can't be opened.

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

function intervalRounds(input: MaterializeInput): SetTarget[] {
  const { settings } = input;
  if (settings?.type !== 'interval') {
    return setRows(input);
  }
  return Array.from({ length: settings.rounds }, (_, index) => {
    const isLast = index === settings.rounds - 1;
    return {
      setNumber: index + 1,
      targetWorkSec: settings.workSec,
      ...(isLast ? {} : { targetRestSec: settings.restSec }),
    };
  });
}

function mobilityBlock(input: MaterializeInput): SetTarget[] {
  const { settings } = input;
  if (settings?.type !== 'mobility') {
    return setRows(input);
  }
  return [{ setNumber: 1, targetWorkSec: settings.durationSec }];
}

const MATERIALIZERS: Record<ExerciseType, Materializer> = {
  strength: setRows,
  power: setRows,
  interval: intervalRounds,
  mobility: mobilityBlock,
};

/** The rows `entry` starts its week with, by the type of its exercise. */
export function materializeSetTargets(type: ExerciseType, input: MaterializeInput): SetTarget[] {
  return MATERIALIZERS[type](input);
}

/**
 * Whether a type's rows are sets of reps and load — the rows Flow C's history prices at Start
 * (`prescribeBlockStart`). An interval's rounds and a mobility block carry their times from the
 * cycle and are not re-priced.
 */
export function rowsAreSets(type: ExerciseType): boolean {
  return MATERIALIZERS[type] === setRows;
}
