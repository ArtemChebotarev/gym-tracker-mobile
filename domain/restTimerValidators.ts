// What the rest between sets setting may hold (10.1 FR-5, GT-87) — see `restTimer.ts`.

import { TIME_STEP_SEC } from './exerciseConfig';
import { REST_BETWEEN_SETS_RANGE_SEC, type RestBetweenSets } from './restTimer';

/**
 * Throws unless `setting` is one the rest between sets may hold: a whole number of
 * `TIME_STEP_SEC` steps within `REST_BETWEEN_SETS_RANGE_SEC` (1:00–5:00) — the same step every
 * rest in the app is set in.
 */
export function assertRestBetweenSets(setting: RestBetweenSets): void {
  const { restSec } = setting;
  if (
    !Number.isInteger(restSec) ||
    restSec % TIME_STEP_SEC !== 0 ||
    restSec < REST_BETWEEN_SETS_RANGE_SEC.min ||
    restSec > REST_BETWEEN_SETS_RANGE_SEC.max
  ) {
    throw new Error(
      `Rest between sets must be ${REST_BETWEEN_SETS_RANGE_SEC.min}–${REST_BETWEEN_SETS_RANGE_SEC.max} s in ${TIME_STEP_SEC} s steps, got ${restSec}.`,
    );
  }
}
