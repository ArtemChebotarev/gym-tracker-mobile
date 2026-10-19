// SessionExercise status rule — see 05 · Workout Execution & Logging, "Статус упражнения":
// `completed` once every set row is logged, `skipped` only by explicit action, `abandoned` only by
// Stop mesocycle (136), `planned` otherwise. Pure: the use case layer reads the logs and persists
// the result.

import type { RoundLog, SessionExercise, SessionExerciseStatus, SetLog } from '@domain/execution';

/**
 * The two ways an exercise closes without being done: `skipped` by the user, `abandoned` by Stop
 * mesocycle (136). Either way its unlogged rows are finished with — they count as done for the
 * progress bar and read as not done on the card, each under its own word.
 */
export type NotDoneStatus = Extract<SessionExerciseStatus, 'skipped' | 'abandoned'>;

export function isNotDone(status: SessionExerciseStatus): status is NotDoneStatus {
  return status === 'skipped' || status === 'abandoned';
}

/** A logged row as the status rule reads it: whose it is, and which row. */
export type RowLog = Pick<SetLog, 'sessionExerciseId' | 'setNumber'>;

/**
 * An interval's round logs as rows: a round is planned as a `SetTarget` whose `setNumber` is the
 * round number (10 · Hybrid Exercises), so a logged round marks that row the way a set log does.
 */
export function roundRowLogs(roundLogs: readonly RoundLog[]): RowLog[] {
  return roundLogs.map((log) => ({
    sessionExerciseId: log.sessionExerciseId,
    setNumber: log.roundNumber,
  }));
}

/**
 * The status an exercise that isn't skipped or abandoned has, given its logs — set logs, or an
 * interval's rounds as rows (`roundRowLogs`): `completed` when every row of `setTargets` has a log
 * with its `setNumber`, `planned` otherwise (10.1 FR-7 for rounds). Logs of other session
 * exercises are ignored. Re-evaluated after every change to the rows or their logs — logging and
 * un-logging a set (045), adding or removing one (046), unskipping the exercise (049).
 */
export function statusFromLogs(
  sessionExercise: Pick<SessionExercise, 'id' | 'setTargets'>,
  logs: readonly RowLog[],
): Exclude<SessionExerciseStatus, NotDoneStatus> {
  const loggedSetNumbers = new Set(
    logs.filter((log) => log.sessionExerciseId === sessionExercise.id).map((log) => log.setNumber),
  );
  const allLogged = sessionExercise.setTargets.every((target) =>
    loggedSetNumbers.has(target.setNumber),
  );
  return allLogged ? 'completed' : 'planned';
}
