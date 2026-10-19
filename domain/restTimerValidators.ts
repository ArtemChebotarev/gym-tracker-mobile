// What the strength rest timer setting may hold (10.1 FR-5, GT-87) — see `restTimer.ts`.

import { CONFIG_TIME_STEP_SEC } from './exerciseConfig';
import { STRENGTH_REST_RANGE_SEC, type StrengthRestTimer } from './restTimer';

/**
 * Throws unless `setting` is one the strength rest timer may hold: a whole number of
 * `CONFIG_TIME_STEP_SEC` steps within `STRENGTH_REST_RANGE_SEC` (1:00–5:00) — the same step every
 * rest in the app is set in.
 */
export function assertStrengthRestTimer(setting: StrengthRestTimer): void {
  const { restSec } = setting;
  if (
    !Number.isInteger(restSec) ||
    restSec % CONFIG_TIME_STEP_SEC !== 0 ||
    restSec < STRENGTH_REST_RANGE_SEC.min ||
    restSec > STRENGTH_REST_RANGE_SEC.max
  ) {
    throw new Error(
      `Rest between sets must be ${STRENGTH_REST_RANGE_SEC.min}–${STRENGTH_REST_RANGE_SEC.max} s in ${CONFIG_TIME_STEP_SEC} s steps, got ${restSec}.`,
    );
  }
}
