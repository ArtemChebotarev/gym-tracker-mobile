// Set row edits on a session exercise — see 05 · Workout Execution & Logging, "Добавить подход"
// and "Удалить последний подход". Rows are only ever added or removed at the end, so they never
// need renumbering. Pure: the use case layer handles the row's set log and persists the result.

import { ConflictError } from '@domain/errors';
import type { SetTarget } from '@domain/execution';

/**
 * `setTargets` with one row appended: the next `setNumber`, and `targetReps` and
 * `suggestedWeight` copied from the current last row. The weight hint isn't copied — it comes from
 * a source set's fact (03, rule 3), and the new row has none.
 */
export function withAddedSet(setTargets: readonly SetTarget[]): SetTarget[] {
  const last = setTargets[setTargets.length - 1];
  const added: SetTarget = { setNumber: (last?.setNumber ?? 0) + 1 };
  if (last?.targetReps !== undefined) {
    added.targetReps = last.targetReps;
  }
  if (last?.suggestedWeight !== undefined) {
    added.suggestedWeight = last.suggestedWeight;
  }
  return [...setTargets, added];
}

/**
 * `setTargets` without its last row, plus the row removed. Throws `ConflictError` when only one row
 * is left — an exercise always keeps at least one set.
 */
export function withoutLastSet(setTargets: readonly SetTarget[]): {
  setTargets: SetTarget[];
  removed: SetTarget;
} {
  const removed = setTargets[setTargets.length - 1];
  if (removed === undefined || setTargets.length === 1) {
    throw new ConflictError('The only set of an exercise can’t be removed.');
  }
  return { setTargets: setTargets.slice(0, -1), removed };
}

/**
 * Rows an exercise added mid-session starts with (05 · Workout Execution & Logging, "Добавить
 * внеплановое упражнение").
 */
export const ADDED_EXERCISE_SET_COUNT = 2;
