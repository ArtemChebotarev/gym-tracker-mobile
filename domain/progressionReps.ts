// Progression engine, rule 2 — per-set target reps. See 03 · Progression Engine, "Правило 2 —
// повторы". Pure functions: set N of the next week is computed from set N of the source
// session, each set on its own.

import type { SessionExercise, SetLog, SetTarget } from '@domain/execution';
import type { ProgressionSettings } from '@domain/mesocycle';
import { weightHintForReps } from '@domain/progressionWeightHint';

type RepCorridor = Pick<ProgressionSettings, 'minReps' | 'maxReps'>;

/** `clamp(loggedReps + 1, minReps, maxReps)`. */
export function nextTargetReps(loggedReps: number, settings: RepCorridor): number {
  return Math.min(Math.max(loggedReps + 1, settings.minReps), settings.maxReps);
}

/**
 * Next week's target for one set row.
 *
 * - Logged: reps progress by rule 2, the logged weight becomes the next `suggestedWeight`, and
 *   the set gets its own weight hint by rule 3.
 * - Not logged (skipped): the row carries over its previous `targetReps` and `suggestedWeight`
 *   with no increment. There is no new fact to judge, so no weight hint is carried.
 */
export function nextSetTarget(
  source: SetTarget,
  log: Pick<SetLog, 'reps' | 'weight'> | undefined,
  settings: RepCorridor,
): SetTarget {
  if (log === undefined) {
    return {
      setNumber: source.setNumber,
      targetReps: source.targetReps,
      suggestedWeight: source.suggestedWeight,
    };
  }
  return {
    setNumber: source.setNumber,
    targetReps: nextTargetReps(log.reps, settings),
    suggestedWeight: log.weight,
    weightHint: weightHintForReps(log.reps, settings),
  };
}

/**
 * Next week's set targets for one exercise: one row per source row (rule 1 — the row count is
 * copied, never grown), each paired with the source session's `SetLog` of the same
 * `setNumber`. Logs belonging to other session exercises are ignored.
 */
export function nextSetTargets(
  source: Pick<SessionExercise, 'id' | 'setTargets'>,
  logs: readonly SetLog[],
  settings: RepCorridor,
): SetTarget[] {
  const logsBySetNumber = new Map<number, SetLog>();
  for (const log of logs) {
    if (log.sessionExerciseId === source.id && !logsBySetNumber.has(log.setNumber)) {
      logsBySetNumber.set(log.setNumber, log);
    }
  }
  return source.setTargets.map((target) =>
    nextSetTarget(target, logsBySetNumber.get(target.setNumber), settings),
  );
}
