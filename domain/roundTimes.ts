// What a round passes on to the round planned after it — one more round of the same exercise
// (Add round, GT-91) or the same round next week (GT-93; 03, "Структура наследуется от факта").
// A round's times are its plan, not a goal it can miss, so the fact replaces the plan as it is:
// the times a round was done with, its planned ones while it isn't logged. A one-off is no new plan
// (10.1, FR-6, FR-8): a round ended early keeps the planned work, a skipped rest the planned rest.
// A time picked on the card is the round's plan too, and is stored as one (`withRoundTime`, GT-187).
// Pure.

import { NotFoundError } from '@domain/errors';
import { INTERVAL_REST_MIN_SEC, TIME_STEP_SEC } from '@domain/exerciseConfig';
import type { RoundLog, SetTarget } from '@domain/execution';

export type RoundTimes = Pick<SetTarget, 'targetWorkSec' | 'targetRestSec'>;

/**
 * The times `planned` (a round's target) hands on, given its log if it is logged. A target with no
 * times and nothing logged gives none, and the round's fields start empty (10.1 FR-9).
 */
export function roundTimesOf(
  planned: RoundTimes | undefined,
  log?: Pick<RoundLog, 'workSec' | 'restSec' | 'restSkipped' | 'completed'>,
): RoundTimes {
  const times: RoundTimes = {};
  const workSec = log?.completed ? log.workSec : planned?.targetWorkSec;
  if (workSec !== undefined) {
    times.targetWorkSec = workSec;
  }
  const restSec = (log?.restSkipped === false ? log.restSec : undefined) ?? planned?.targetRestSec;
  if (restSec !== undefined) {
    times.targetRestSec = restSec;
  }
  return times;
}

/** The two times of a round the user picks in a workout. */
export type RoundTimeColumn = 'work' | 'rest';

/**
 * What a picked time may be, by column, and its step — the round fields' picker (10.1 FR-9): work
 * from 0:05 to an hour, rest from 0:10 (GT-176) to ten minutes.
 */
export const ROUND_TIME_BOUNDS: Record<
  RoundTimeColumn,
  { minSec: number; maxSec: number; stepSec: number }
> = {
  work: { minSec: TIME_STEP_SEC, maxSec: 60 * 60, stepSec: TIME_STEP_SEC },
  rest: { minSec: INTERVAL_REST_MIN_SEC, maxSec: 10 * 60, stepSec: TIME_STEP_SEC },
};

/**
 * `setTargets` with `column` of each round in `roundNumbers` set to `sec` — a time picked on the
 * card, and the rounds below that followed it (10.1 FR-9, GT-187). An interval's time is its
 * structure, not a result, so it is stored as the round's plan right away: it outlives the screen,
 * and the round is logged and timed with it.
 *
 * Throws `NotFoundError` for a round the exercise doesn't have, and an `Error` for a time the picker
 * can't give (`ROUND_TIME_BOUNDS`).
 */
export function withRoundTime(
  setTargets: readonly SetTarget[],
  column: RoundTimeColumn,
  roundNumbers: readonly number[],
  sec: number,
): SetTarget[] {
  const { minSec, maxSec } = ROUND_TIME_BOUNDS[column];
  if (!Number.isInteger(sec) || sec < minSec || sec > maxSec) {
    throw new Error(`A round's ${column} must be ${minSec}–${maxSec} s, got ${sec}.`);
  }
  for (const roundNumber of roundNumbers) {
    if (!setTargets.some((target) => target.setNumber === roundNumber)) {
      throw new NotFoundError(`The exercise has no round ${roundNumber}.`);
    }
  }
  const key = column === 'work' ? 'targetWorkSec' : 'targetRestSec';
  return setTargets.map((target) =>
    roundNumbers.includes(target.setNumber) ? { ...target, [key]: sec } : target,
  );
}
