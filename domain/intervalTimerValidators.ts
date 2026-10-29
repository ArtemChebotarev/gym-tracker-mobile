// What an interval timer may be started with (10.1 FR-6, GT-95) — see `intervalTimer.ts`.

import { GET_READY_RANGE_SEC, GET_READY_STEP_SEC, type IntervalTimerRound } from './intervalTimer';

/**
 * Throws unless the timer can run `rounds` with `getReadySec`: at least one round, work of at
 * least 1 s and rests of at least 0, in whole seconds — the same times a round is logged with.
 */
export function assertIntervalTimerStart(
  rounds: readonly IntervalTimerRound[],
  getReadySec: number,
): void {
  if (rounds.length === 0) {
    throw new Error('An interval timer needs at least one round.');
  }
  if (!Number.isInteger(getReadySec) || getReadySec < 0) {
    throw new Error(
      `Get ready must be a whole number of seconds of at least 0, got ${getReadySec}.`,
    );
  }
  for (const round of rounds) {
    if (!Number.isInteger(round.workSec) || round.workSec < 1) {
      throw new Error(
        `Work must be a whole number of seconds of at least 1, got ${round.workSec}.`,
      );
    }
    if (!Number.isInteger(round.restSec) || round.restSec < 0) {
      throw new Error(
        `Rest must be a whole number of seconds of at least 0, got ${round.restSec}.`,
      );
    }
  }
}

/** Throws unless `getReadySec` is one the Get ready setting may hold (`GET_READY_RANGE_SEC`). */
export function assertGetReadySec(getReadySec: number): void {
  if (
    !Number.isInteger(getReadySec) ||
    getReadySec % GET_READY_STEP_SEC !== 0 ||
    getReadySec < GET_READY_RANGE_SEC.min ||
    getReadySec > GET_READY_RANGE_SEC.max
  ) {
    throw new Error(
      `Get ready must be ${GET_READY_RANGE_SEC.min}–${GET_READY_RANGE_SEC.max} s, got ${getReadySec}.`,
    );
  }
}
