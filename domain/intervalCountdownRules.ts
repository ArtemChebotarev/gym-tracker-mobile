// When the countdown of an interval timer's phase starts (10.1 FR-6, GT-94) — see
// `intervalCountdown.ts` for the types. Like the rest timer's rules, it takes `now` rather than
// reading a clock: the phase's end is a moment in time, not a count of ticks, so the answer is the
// same after the app slept.

import { COUNTDOWN_SEC, type CountdownStart } from './intervalCountdown';

const MS_PER_SEC = 1000;

/**
 * When to start the countdown clip so its start signal lands on `phaseEndsAt`, both epoch
 * milliseconds. With `COUNTDOWN_SEC` or more left it waits; with less it starts at once, part way
 * into the clip — at the very end only the signal is left, which is what a Get ready of 0 gets.
 * `null` once the phase is over: a signal for a phase that has already moved on is a wrong one.
 */
export function countdownStart(phaseEndsAt: number, now: number): CountdownStart | null {
  if (now > phaseEndsAt) {
    return null;
  }
  const startsAt = phaseEndsAt - COUNTDOWN_SEC * MS_PER_SEC;
  if (now <= startsAt) {
    return { delayMs: startsAt - now, offsetSec: 0 };
  }
  return { delayMs: 0, offsetSec: (now - startsAt) / MS_PER_SEC };
}
