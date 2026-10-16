// What the time picker's two wheels hold and how they map to seconds — pure, so the sheet is only
// rendering (canvas 8.2, "Time picker for a round field": minutes and seconds in steps of 5 s).

/** The wheels' positions of `totalSec`: whole minutes, and the seconds past them. */
export function splitSeconds(totalSec: number): { minutes: number; seconds: number } {
  const whole = Math.max(0, Math.round(totalSec));
  return { minutes: Math.floor(whole / 60), seconds: whole % 60 };
}

/** `totalSec` held within `[minSec, maxSec]`. */
export function clampSeconds(totalSec: number, minSec: number, maxSec: number): number {
  return Math.min(maxSec, Math.max(minSec, totalSec));
}

/** The values of the minutes wheel: 0 up to the whole minutes `maxSec` holds. */
export function minuteOptions(maxSec: number): number[] {
  return Array.from({ length: Math.floor(maxSec / 60) + 1 }, (_, minute) => minute);
}

/** The values of the seconds wheel: 0, `stepSec`, 2 x `stepSec`, … below a minute. */
export function secondOptions(stepSec: number): number[] {
  return Array.from({ length: Math.ceil(60 / stepSec) }, (_, index) => index * stepSec);
}

/**
 * The value after one wheel moved: `minutes` and `seconds` joined and held within bounds. The
 * other wheel is left where the user put it unless the bounds push it, so a minimum of 0:05 does
 * not let 0:00 be picked and a maximum of 10:00 does not let 10:30.
 */
export function joinSeconds(
  minutes: number,
  seconds: number,
  minSec: number,
  maxSec: number,
): number {
  return clampSeconds(minutes * 60 + seconds, minSec, maxSec);
}
