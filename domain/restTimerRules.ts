// The rules of the rest timer between sets (10.1 FR-5, GT-86) — see `restTimer.ts` for the types.
//
// - It starts by itself after a set is logged, for the exercise's rest: power's from its own field
//   (the cycle's copy first, then the library's), strength's from Settings (GT-87). Interval and
//   mobility have none — an interval runs its own timer, mobility rests not at all.
// - After the last set too — the rest before the next exercise, which never starts by itself — but
//   not once the workout has nothing left to do (Artem, 19.10.2026): n sets, n rests. "Last" is
//   whatever leaves no set still to do, so a set logged out of order still rests before the one
//   that is left.
// - Skip and Pause; no ±15 s. It never feeds the progression.

import type { ExerciseType } from './catalog';
import type { ExerciseConfig, ExerciseSettings } from './exerciseConfig';
import { defaultExerciseConfig } from './exerciseConfigBuilders';
import type { RestNext, RestTimer, StrengthRestTimer } from './restTimer';

const MS_PER_SEC = 1000;

/** The power rest a new exercise starts with (FR-9) — what one with no rest of its own gets. */
function defaultPowerRestSec(): number {
  const config = defaultExerciseConfig('power');
  return config?.type === 'power' ? config.restSec : 0;
}

/** Strength's rest from its setting: its seconds while the timer is on, none while it is off. */
export function strengthRestSecOf(setting: StrengthRestTimer): number | undefined {
  return setting.enabled ? setting.restSec : undefined;
}

/**
 * Seconds of rest after a set of an exercise of `type`, or `undefined` when it has none: an
 * interval or mobility exercise, a strength one while its timer is off, or a rest set to 0.
 * `settings` is the cycle's copy of the exercise's config (`Mesocycle.exerciseSettings`), `config`
 * the library's, `strengthRestSec` strength's from Settings (`strengthRestSecOf`).
 */
export function restSecFor(
  type: ExerciseType | undefined,
  settings: ExerciseSettings | undefined,
  config: ExerciseConfig | undefined,
  strengthRestSec: number | undefined,
): number | undefined {
  let restSec: number;
  switch (type ?? 'strength') {
    case 'strength':
      if (strengthRestSec === undefined) return undefined;
      restSec = strengthRestSec;
      break;
    case 'power':
      restSec =
        (settings?.type === 'power' ? settings.restSec : undefined) ??
        (config?.type === 'power' ? config.restSec : undefined) ??
        defaultPowerRestSec();
      break;
    default:
      return undefined;
  }
  return restSec > 0 ? restSec : undefined;
}

/** A set row as far as the rest timer cares: its number, and whether it is still to be done. */
export type RestSetRow = { setNumber: number; open: boolean };

/**
 * The set the rest after logging `loggedSetNumber` is before — the first other row still to be
 * done — or `undefined` when none is left, and the rest, if any, is before the next exercise.
 */
export function nextSetAfter(
  rows: readonly RestSetRow[],
  loggedSetNumber: number,
): number | undefined {
  return rows.find((row) => row.open && row.setNumber !== loggedSetNumber)?.setNumber;
}

/** A rest of `durationSec` before `next`, running from `now`. */
export function startRestTimer(
  rest: { sessionExerciseId: string; next: RestNext; durationSec: number },
  now: number,
): RestTimer {
  const durationMs = rest.durationSec * MS_PER_SEC;
  return {
    sessionExerciseId: rest.sessionExerciseId,
    next: rest.next,
    durationMs,
    endsAt: now + durationMs,
  };
}

/** Whether the rest is counting down rather than paused. */
export function isRunning(timer: RestTimer): boolean {
  return timer.endsAt !== undefined;
}

/** Milliseconds of rest left at `now`, never below 0. */
export function restRemainingMs(timer: RestTimer, now: number): number {
  const left = timer.endsAt !== undefined ? timer.endsAt - now : (timer.remainingMs ?? 0);
  return Math.max(0, left);
}

/** Whole seconds left as the capsule shows them: a rest with 0.2 s to go still reads 0:01. */
export function restRemainingSec(timer: RestTimer, now: number): number {
  return Math.ceil(restRemainingMs(timer, now) / MS_PER_SEC);
}

/** The share of the rest still to go, 0..1 — what the capsule's ring is filled with. */
export function restProgress(timer: RestTimer, now: number): number {
  return timer.durationMs > 0 ? restRemainingMs(timer, now) / timer.durationMs : 0;
}

/** Whether a running rest has run out at `now`. A paused one never does. */
export function restIsOver(timer: RestTimer, now: number): boolean {
  return isRunning(timer) && restRemainingMs(timer, now) === 0;
}

/** The rest held where it is at `now`. Pausing a paused rest changes nothing. */
export function pauseRestTimer(timer: RestTimer, now: number): RestTimer {
  if (!isRunning(timer)) return timer;
  const { endsAt: _endsAt, ...rest } = timer;
  return { ...rest, remainingMs: restRemainingMs(timer, now) };
}

/** The rest running again from `now` with what was left. Resuming a running rest changes nothing. */
export function resumeRestTimer(timer: RestTimer, now: number): RestTimer {
  if (isRunning(timer)) return timer;
  const { remainingMs, ...rest } = timer;
  return { ...rest, endsAt: now + (remainingMs ?? 0) };
}
