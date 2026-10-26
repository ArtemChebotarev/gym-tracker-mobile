// The interval rule — 10 · Hybrid Exercises, "Interval: рычаги прогрессии"; 10.1 FR-8. Every
// planned round done → the plan steps by the exercise's lever; any round not done → the plan
// repeats as it is. The rounds it steps are next week's already, inherited from the fact
// (`roundTimesOf`), so a rest or a round count changed in the workout is the new structure the
// lever steps from, and a skipped rest — a one-off — never moves it. Pure.
//
// The lever never moves past its edge: the rest stays at `INTERVAL_REST_MIN_SEC` at the least.
// What is said at the edge (a hint, as rule 3's) is not this rule's; there is no switch to another
// lever (FR-8).

import type { RoundLog, SetTarget } from '@domain/execution';
import { type IntervalConfig, INTERVAL_REST_MIN_SEC } from '@domain/exerciseConfig';

/** The lever an interval exercise progresses by in its cycle, and its step (FR-8). */
export type IntervalProgression = Pick<IntervalConfig, 'lever' | 'stepSec'>;

/**
 * Whether every round of `planned` was done: logged, and not cut short with End early (FR-6). An
 * exercise with no rounds has none done.
 */
export function allRoundsDone(
  planned: readonly Pick<SetTarget, 'setNumber'>[],
  logByRound: ReadonlyMap<number, Pick<RoundLog, 'completed'>>,
): boolean {
  return planned.length > 0 && planned.every((round) => logByRound.get(round.setNumber)?.completed);
}

/**
 * `rounds` one lever step on: less rest, more work, or one round more — a copy of the last, as Add
 * round makes one (GT-91). `none` keeps them as they are.
 */
export function stepLever(
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
