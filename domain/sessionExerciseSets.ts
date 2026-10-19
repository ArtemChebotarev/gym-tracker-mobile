// Set row edits on a session exercise — see 05 · Workout Execution & Logging, "Добавить подход"
// and "Удалить последний подход" — and an interval's rounds, which are set rows too (GT-91). Rows
// are only ever added or removed at the end, so they never need renumbering. Pure: the use case
// layer handles the row's log and persists the result.

import { ConflictError } from '@domain/errors';
import type { SetTarget } from '@domain/execution';

/**
 * `setTargets` with one row appended: the next `setNumber` and the `suggestedWeight` copied from
 * the current last row. No `targetReps` and no weight hint: the row has no history, so there is no
 * rep goal to miss (a shortfall must not read as `−N`) — only a weight to start from (03, rule 3).
 */
export function withAddedSet(setTargets: readonly SetTarget[]): SetTarget[] {
  const last = setTargets[setTargets.length - 1];
  const added: SetTarget = { setNumber: (last?.setNumber ?? 0) + 1 };
  if (last?.suggestedWeight !== undefined) {
    added.suggestedWeight = last.suggestedWeight;
  }
  return [...setTargets, added];
}

/**
 * `setTargets` with one round appended — an interval's rounds are its set targets (10 · Hybrid
 * Exercises). Unlike a set, a round's times are its plan, not a goal it can miss: the new round
 * copies the last one's work and rest, so it reads as one more of the same. A last round with no
 * times of its own gives none, and the card falls back on the cycle's plan for both.
 */
export function withAddedRound(setTargets: readonly SetTarget[]): SetTarget[] {
  const last = setTargets[setTargets.length - 1];
  const added: SetTarget = { setNumber: (last?.setNumber ?? 0) + 1 };
  if (last?.targetWorkSec !== undefined) {
    added.targetWorkSec = last.targetWorkSec;
  }
  if (last?.targetRestSec !== undefined) {
    added.targetRestSec = last.targetRestSec;
  }
  return [...setTargets, added];
}

function withoutLastRow(
  setTargets: readonly SetTarget[],
  unit: 'set' | 'round',
): { setTargets: SetTarget[]; removed: SetTarget } {
  const removed = setTargets[setTargets.length - 1];
  if (removed === undefined || setTargets.length === 1) {
    throw new ConflictError(`The only ${unit} of an exercise can’t be removed.`);
  }
  return { setTargets: setTargets.slice(0, -1), removed };
}

/**
 * `setTargets` without its last row, plus the row removed. Throws `ConflictError` when only one row
 * is left — an exercise always keeps at least one set.
 */
export function withoutLastSet(setTargets: readonly SetTarget[]) {
  return withoutLastRow(setTargets, 'set');
}

/** `withoutLastSet` for an interval's rounds: it always keeps at least one round. */
export function withoutLastRound(setTargets: readonly SetTarget[]) {
  return withoutLastRow(setTargets, 'round');
}

/**
 * Rows an exercise added mid-session starts with (05 · Workout Execution & Logging, "Добавить
 * внеплановое упражнение").
 */
export const ADDED_EXERCISE_SET_COUNT = 2;
