// The rest timer between sets (10.1 FR-5, GT-86). Types and fixed values only; the rules — when it
// starts, how long, pause and resume, what is left — live beside it in `restTimerRules.ts`.
//
// Times are epoch milliseconds from whatever clock the caller reads, never read here: the rules
// take `now` as an argument, so they run the same on a fake clock as on the phone's, and a timer
// that was running while the app slept is still right when it wakes — what is left is always
// `endsAt − now`, not a count of ticks.

/** Rest between sets of a strength exercise until Settings has its own value (FR-5: "по умолчанию 2:00"). */
export const STRENGTH_REST_SEC = 120;

/** A rest that is counting down, or paused part way. Exactly one of `endsAt` / `remainingMs` is set. */
export type RestTimer = {
  /** The exercise whose set was just logged. */
  sessionExerciseId: string;
  /** The set the rest is before — what the capsule says comes next. */
  nextSetNumber: number;
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
  nextSetNumber: number;
};
