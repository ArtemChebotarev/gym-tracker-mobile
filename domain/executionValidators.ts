// Session invariant validators — see 02 · Domain Model ("Session") and
// 03 · Progression Engine ("Ленивая генерация по дням"). Kept separate from
// `domain/execution.ts` (types only) per the single-responsibility rule in
// AGENTS.md.

import type { Session, SessionExercise } from '@domain/execution';

/**
 * Throws if two sessions in `sessions` share the same `(mesoId, weekNumber,
 * dayNumber)` triple (02 · Domain Model, "Session", invariants: "Пара
 * (mesoId, weekNumber, dayNumber) уникальна").
 */
export function validateUniqueSessionSlots(sessions: readonly Session[]): void {
  const seen = new Set<string>();
  for (const session of sessions) {
    const key = `${session.mesoId}:${session.weekNumber}:${session.dayNumber}`;
    if (seen.has(key)) {
      throw new Error(
        `Duplicate session for mesoId "${session.mesoId}", week ${session.weekNumber}, day ${session.dayNumber}.`,
      );
    }
    seen.add(key);
  }
}

/**
 * Throws if more than one of `sessions` has `status: 'in_progress'` (02 ·
 * Domain Model, "Session", invariants: "Только одна сессия может быть
 * in_progress во всём приложении"). Callers validate the resulting collection
 * across the whole app, not just within one mesocycle.
 */
export function validateSingleInProgressSession(sessions: readonly Session[]): void {
  const inProgressCount = sessions.filter((session) => session.status === 'in_progress').length;
  if (inProgressCount > 1) {
    throw new Error(`Only one session may be in_progress at a time, found ${inProgressCount}.`);
  }
}

/**
 * Throws if `session` is `awaiting_source` and either carries session exercises
 * or is being started (02 · Domain Model, "Session", invariants: "Сессия в
 * awaiting_source не имеет SessionExercise"; 03 · Progression Engine,
 * "Ленивая генерация по дням": `awaiting_source` is a wait state, not a
 * startable one).
 */
export function validateAwaitingSourceSession(
  session: Session,
  exercises: readonly SessionExercise[],
): void {
  if (session.prescriptionStatus !== 'awaiting_source') {
    return;
  }
  if (exercises.length > 0) {
    throw new Error(
      `Session "${session.id}" is awaiting_source and must not have session exercises, found ${exercises.length}.`,
    );
  }
  if (session.status === 'in_progress') {
    throw new Error(`Session "${session.id}" is awaiting_source and cannot be started.`);
  }
}

/** What the user entered in a set row: an empty field (only a placeholder showing) is `null`. */
export type SetEntry = { weight: number | null; reps: number | null };

/**
 * Throws unless both fields of a set row hold a value (05 · Workout Execution & Logging, "Записать
 * подход": the placeholder isn't a value, a set can be logged only once both fields are filled).
 * `reps` must be a whole number of at least 1 and `weight` a finite number of at least 0 —
 * bodyweight work is logged at 0.
 */
export function validateSetEntry(
  entry: SetEntry,
): asserts entry is { weight: number; reps: number } {
  const { weight, reps } = entry;
  if (weight === null || reps === null) {
    throw new Error('A set can be logged only once both weight and reps are entered.');
  }
  if (!Number.isFinite(weight) || weight < 0) {
    throw new Error(`Weight must be a finite number of at least 0, got ${weight}.`);
  }
  if (!Number.isInteger(reps) || reps < 1) {
    throw new Error(`Reps must be a whole number of at least 1, got ${reps}.`);
  }
}
