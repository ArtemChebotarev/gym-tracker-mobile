// Set row edits on a session exercise — see 05 · Workout Execution & Logging, "Добавить подход"
// and "Удалить последний подход" — and an interval's rounds, which are set rows too (GT-91). Rows
// are only ever added or removed at the end, so they never need renumbering. Pure: the use case
// layer handles the row's log and persists the result.

import { ConflictError } from '@domain/errors';
import type { RoundLog, SetTarget } from '@domain/execution';
import { roundTimesOf } from '@domain/roundTimes';

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
 * Exercises). The new round is one more of the last: it takes what that round hands on
 * (`roundTimesOf`) — the times it was done with when it is logged (`lastRoundLog`), its planned
 * ones otherwise.
 */
export function withAddedRound(
  setTargets: readonly SetTarget[],
  lastRoundLog?: Pick<RoundLog, 'workSec' | 'restSec' | 'restSkipped' | 'completed'>,
): SetTarget[] {
  const last = setTargets[setTargets.length - 1];
  return [
    ...setTargets,
    { setNumber: (last?.setNumber ?? 0) + 1, ...roundTimesOf(last, lastRoundLog) },
  ];
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
