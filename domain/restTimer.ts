// The rest timer between sets (10.1 FR-5, GT-86). Types and fixed values only; the rules — when it
// starts, how long, pause and resume, what is left — live beside it in `restTimerRules.ts`.
//
// Times are epoch milliseconds from whatever clock the caller reads, never read here: the rules
// take `now` as an argument, so they run the same on a fake clock as on the phone's, and a timer
// that was running while the app slept is still right when it wakes — what is left is always
// `endsAt − now`, not a count of ticks.

/** Rest between sets before the user sets their own (FR-5: "по умолчанию 2:00"). */
export const REST_BETWEEN_SETS_SEC = 120;

/**
 * The rest between sets, a global setting (10.1 FR-5, GT-87): on by default, 2:00. One for strength
 * and power exercises alike (GT-188) — neither keeps a rest of its own. An interval rests between
 * its rounds by their own times, and mobility not at all.
 */
export type RestBetweenSets = {
  enabled: boolean;
  /** Rest between sets, seconds — a whole number of `CONFIG_TIME_STEP_SEC` steps. */
  restSec: number;
};

/**
 * What the setting may hold, seconds (Artem, 18.10.2026). Under a minute the next sets lose reps at
 * the same weight, and the volume that drives hypertrophy goes with them; past five minutes is
 * more than even a heavy squat or deadlift asks for. The app has no supersets, so nothing needs a
 * shorter rest.
 */
export const REST_BETWEEN_SETS_RANGE_SEC = { min: 60, max: 5 * 60 } as const;

/**
 * What the rest is before: the exercise's next set — or an interval's next round, logged by hand
 * (GT-89) — or, after the last of them, the next exercise with work left in the workout (Artem,
 * 19.10.2026). `name` is the exercise it is in. The capsule says it; nothing starts by itself.
 */
export type RestNext =
  | { kind: 'set'; name: string; setNumber: number }
  | { kind: 'round'; name: string; roundNumber: number }
  | { kind: 'exercise'; name: string };

/** A rest that is counting down, or paused part way. Exactly one of `endsAt` / `remainingMs` is set. */
export type RestTimer = {
  /** The exercise whose set was just logged. */
  sessionExerciseId: string;
  /** What the rest is before — what the capsule says comes next. */
  next: RestNext;
  /** The whole rest, milliseconds — the share of it still to go fills the ring. */
  durationMs: number;
  /** Running: when the rest is over. */
  endsAt?: number;
  /** Paused: what was left when it was paused. */
  remainingMs?: number;
};

/** What a rest that ran out leaves on screen until it is put away or the next one starts. */
export type FinishedRest = {
  sessionExerciseId: string;
  next: RestNext;
};
