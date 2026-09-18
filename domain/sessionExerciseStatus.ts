// SessionExercise status rule — see 05 · Workout Execution & Logging, "Статус упражнения":
// `completed` once every set row is logged, `skipped` only by explicit action, `planned`
// otherwise. Pure: the use case layer reads the logs and persists the result.

import type { SessionExercise, SessionExerciseStatus, SetLog } from '@domain/execution';

/**
 * The status an exercise that isn't skipped has, given its set logs: `completed` when every row of
 * `setTargets` has a log with its `setNumber`, `planned` otherwise. Logs of other session
 * exercises are ignored. Re-evaluated after every change to the rows or their logs — logging and
 * un-logging a set (045), adding or removing one (046), unskipping the exercise (049).
 */
export function statusFromLogs(
  sessionExercise: Pick<SessionExercise, 'id' | 'setTargets'>,
  logs: readonly SetLog[],
): Exclude<SessionExerciseStatus, 'skipped'> {
  const loggedSetNumbers = new Set(
    logs.filter((log) => log.sessionExerciseId === sessionExercise.id).map((log) => log.setNumber),
  );
  const allLogged = sessionExercise.setTargets.every((target) =>
    loggedSetNumbers.has(target.setNumber),
  );
  return allLogged ? 'completed' : 'planned';
}
