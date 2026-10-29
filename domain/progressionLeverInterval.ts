// The interval lever's step — 10 · Hybrid Exercises, "Interval: рычаги прогрессии"; 10.1 FR-8.
// Applied to next week's rounds when every round was done (`progressionRoundsInterval.ts`). Pure.
//
// The only edge is the rest's: it stays at `INTERVAL_REST_MIN_SEC` at the least. Work and rounds
// have no ceiling (Artem, 26.10.2026) — a block's length already bounds how many steps it takes.
// There is no switch to another lever (FR-8).

import type { SetTarget } from '@domain/execution';
import { type IntervalConfig, INTERVAL_REST_MIN_SEC } from '@domain/exerciseConfig';

/** The lever an interval exercise progresses by in its cycle, and its step (FR-8). */
export type IntervalProgression = Pick<IntervalConfig, 'lever' | 'stepSec'>;

/**
 * `rounds` one lever step on: less rest, more work, or one round more — a copy of the last, as Add
 * round makes one (GT-91). `none` keeps them as they are.
 */
export function stepIntervalLever(
  rounds: readonly SetTarget[],
  { lever, stepSec }: IntervalProgression,
): SetTarget[] {
  switch (lever) {
    case 'rest':
      return rounds.map((round) =>
        round.targetRestSec === undefined
          ? round
          : { ...round, targetRestSec: lessRest(round.targetRestSec, stepSec) },
      );
    case 'workTime':
      return rounds.map((round) =>
        round.targetWorkSec === undefined
          ? round
          : { ...round, targetWorkSec: round.targetWorkSec + stepSec },
      );
    case 'rounds': {
      const last = rounds.at(-1);
      return last ? [...rounds, { ...last, setNumber: last.setNumber + 1 }] : [...rounds];
    }
    case 'none':
      return [...rounds];
  }
}

/** A rest one step shorter, never under the floor — and never raised to it if it already is. */
function lessRest(restSec: number, stepSec: number): number {
  return Math.min(restSec, Math.max(restSec - stepSec, INTERVAL_REST_MIN_SEC));
}
