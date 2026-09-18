// Progression engine, rule 1 — planned set count. See 03 · Progression Engine, "Правило 1 —
// подходы". Pure function over the source session's structure at Finish.

import type { SessionExercise } from '@domain/execution';

/**
 * `targetSets` = the number of set rows (`setTargets.length`) the exercise had in the source
 * session at Finish — copied as is, never grown by the system. Only an explicit `Add set` /
 * `Remove last set` changes it. Skipping doesn't shrink future volume: unlogged rows of a
 * skipped exercise still count, so this deliberately does not look at `SetLog`s.
 */
export function targetSetCount(source: Pick<SessionExercise, 'setTargets'>): number {
  return source.setTargets.length;
}
