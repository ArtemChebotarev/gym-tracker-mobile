// Session lifecycle rules — see 05 · Workout Execution & Logging, "Жизненный цикл сессии":
// `planned` → `in_progress` → `completed`, any unfinished state may become `skipped`, and the two
// final states are irreversible. Pure: the use case layer reads the sessions and persists the
// outcome.

import { ConflictError } from '@domain/errors';
import type { Session, SessionStatus } from '@domain/execution';

/** `completed` and `skipped` can't be left or changed (05, "Жизненный цикл сессии"). */
export const FINAL_SESSION_STATUSES: readonly SessionStatus[] = ['completed', 'skipped'];

export function isFinalSession(session: Pick<Session, 'status'>): boolean {
  return FINAL_SESSION_STATUSES.includes(session.status);
}

/**
 * Throws `ConflictError` unless `session` accepts workout actions — logging a set, adding one,
 * swapping or skipping an exercise, and so on (05, "Действия во время тренировки": only while the
 * session isn't final). An `awaiting_source` session has no exercises yet and is shown in preview
 * only, so it's rejected too.
 */
export function assertSessionOpen(session: Session): void {
  if (isFinalSession(session)) {
    throw new ConflictError(`Session "${session.id}" is ${session.status} and can't be changed.`);
  }
  if (session.prescriptionStatus === 'awaiting_source') {
    throw new ConflictError(
      `Session "${session.id}" is awaiting its source session and can't be started yet.`,
    );
  }
}

/**
 * How a session ends once nothing is left to do in it (05, "Завершение тренировки"): with at least
 * one logged set it becomes `completed` with `completedAt = now`; with none — every exercise
 * skipped before a set was logged — it becomes `skipped`. Finish workout (050), Skip workout (049)
 * and Stop mesocycle (052) all close a session by this one rule, so it lives here rather than in
 * any one of them.
 */
export function closedSession(session: Session, hasLoggedSet: boolean, now: string): Session {
  return hasLoggedSet
    ? { ...session, status: 'completed', completedAt: now }
    : { ...session, status: 'skipped' };
}

export type SessionStartDecision =
  /** The session moves to `in_progress` now — `session` is the updated one to persist. */
  | { kind: 'started'; session: Session }
  /** Already `in_progress` — nothing to write, `startedAt` stays as it was. */
  | { kind: 'continued'; session: Session }
  /** Another session is `in_progress`; the set must not be logged. */
  | { kind: 'conflict'; inProgressSessionId: string };

/**
 * What logging a set does to `session`'s lifecycle (05, "Жизненный цикл сессии"). There's no Start
 * button: the first logged set moves a `planned` session to `in_progress` and stamps `startedAt`
 * with `now`. Only one session may be `in_progress` app-wide, so if `currentInProgress` is a
 * different session the answer is a conflict naming it — the screen offers to open it.
 *
 * Throws `ConflictError` (see `assertSessionOpen`) for a final or `awaiting_source` session.
 */
export function decideSessionStart(
  session: Session,
  currentInProgress: Session | null,
  now: string,
): SessionStartDecision {
  assertSessionOpen(session);
  if (session.status === 'in_progress') {
    return { kind: 'continued', session };
  }
  if (currentInProgress !== null && currentInProgress.id !== session.id) {
    return { kind: 'conflict', inProgressSessionId: currentInProgress.id };
  }
  return { kind: 'started', session: { ...session, status: 'in_progress', startedAt: now } };
}
