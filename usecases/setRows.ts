// Add set / Remove last set — task 046 (05 · Workout Execution & Logging, "Добавить подход",
// "Удалить последний подход"). The fact may differ from the plan both ways. Adding a set changes
// only this session's plan; removing one also lowers the set count of later weeks, since they
// copy the row count at Finish (03, rule 1). Orchestration only — the row edits live in
// `domain/sessionExerciseSets.ts`, the status rule in `domain/sessionExerciseStatus.ts`.

import type { SessionExercise, SetLog } from '@domain/execution';
import { withAddedSet, withoutLastSet } from '@domain/sessionExerciseSets';
import { statusFromLogs } from '@domain/sessionExerciseStatus';
import type { WorkoutRepositories, WorkoutStore } from '@repositories/workout';
import { openSessionExercise, type SessionExerciseRef } from '@usecases/openSession';

/**
 * Saves `sessionExercise` with the status its rows and logs now call for. A skipped exercise stays
 * skipped — changing its row count only shapes later weeks' volume, it doesn't unskip it.
 */
async function saveWithStatus(
  sessionExercise: SessionExercise,
  logs: readonly SetLog[],
  repos: WorkoutRepositories,
): Promise<SessionExercise> {
  const status =
    sessionExercise.status === 'skipped' ? 'skipped' : statusFromLogs(sessionExercise, logs);
  return repos.sessionExerciseRepo.update({ ...sessionExercise, status });
}

/**
 * Appends a set row to the exercise `ref` points at, copying the last row's `targetReps` and
 * `suggestedWeight`. A `completed` exercise goes back to `planned` — the new row isn't logged.
 *
 * Rejects with `NotFoundError` / `ConflictError` as `openSessionExercise` does (missing, or the
 * session is final or `awaiting_source`).
 */
export async function addSet(
  ref: SessionExerciseRef,
  store: WorkoutStore,
): Promise<SessionExercise> {
  return store.transaction(async (repos) => {
    const { sessionExercise } = await openSessionExercise(ref, repos);
    const logs = await repos.setLogRepo.listBySessionExerciseId(sessionExercise.id);
    return saveWithStatus(
      { ...sessionExercise, setTargets: withAddedSet(sessionExercise.setTargets) },
      logs,
      repos,
    );
  });
}

/**
 * Removes the last set row of the exercise `ref` points at, along with its set log if it was
 * logged. If every remaining row is logged, the exercise becomes `completed`.
 *
 * Rejects with `ConflictError` when the exercise has a single row, and as `openSessionExercise`
 * does otherwise.
 */
export async function removeLastSet(
  ref: SessionExerciseRef,
  store: WorkoutStore,
): Promise<SessionExercise> {
  return store.transaction(async (repos) => {
    const { sessionExercise } = await openSessionExercise(ref, repos);
    const { setTargets, removed } = withoutLastSet(sessionExercise.setTargets);

    const logs = await repos.setLogRepo.listBySessionExerciseId(sessionExercise.id);
    const removedLog = logs.find((log) => log.setNumber === removed.setNumber);
    if (removedLog) {
      await repos.setLogRepo.deleteById(removedLog.id);
    }
    return saveWithStatus(
      { ...sessionExercise, setTargets },
      logs.filter((log) => log !== removedLog),
      repos,
    );
  });
}
