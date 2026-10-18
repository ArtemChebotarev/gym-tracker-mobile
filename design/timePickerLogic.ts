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

/**
 * The values of the minutes wheel: the minute `minSec` falls in up to the whole minutes `maxSec`
 * holds. A minute the bounds rule out is not on the wheel at all — offered and then snapped back,
 * it read as a value the picker took (GT-87: a 1:00 minimum that still showed `0 min`).
 */
export function minuteOptions(maxSec: number, minSec = 0): number[] {
  const first = Math.floor(minSec / 60);
  return Array.from({ length: Math.floor(maxSec / 60) - first + 1 }, (_, index) => first + index);
}

/**
 * The values of the seconds wheel: 0, `stepSec`, 2 x `stepSec`, … below a minute — and, given the
 * minute the other wheel is on and the bounds, only those that make a time within them: at a
 * 1:00–5:00 field's 5 minutes the wheel holds `00` alone.
 */
export function secondOptions(
  stepSec: number,
  at?: { minutes: number; minSec: number; maxSec: number },
): number[] {
  const all = Array.from({ length: Math.ceil(60 / stepSec) }, (_, index) => index * stepSec);
  if (at === undefined) return all;
  const allowed = all.filter((seconds) => {
    const total = at.minutes * 60 + seconds;
    return total >= at.minSec && total <= at.maxSec;
  });
  return allowed.length > 0 ? allowed : all;
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
