// Skip / Unskip an exercise — the exercise half of task 049 (05 · Workout Execution & Logging,
// "Пропустить упражнение"). A skip is a normal outcome that must neither break progression nor
// shrink later weeks: logged sets stay and progress, unlogged rows carry over with their targets,
// and the rows themselves are kept — the next week copies their count (03, rules 1–2). Only
// removal (086) takes something out of the future.

import type { SessionExercise } from '@domain/execution';
import { statusFromLogs } from '@domain/sessionExerciseStatus';
import type { WorkoutStore } from '@repositories/workout';
import { openSessionExercise, type SessionExerciseRef } from '@usecases/openSession';

/**
 * Marks the exercise `ref` points at `skipped` — available at any point, including after some of
 * its sets are logged; those logs and every row stay as they are. Skipping an already skipped
 * exercise changes nothing.
 *
 * Rejects as `openSessionExercise` does (missing, or the session is final or `awaiting_source`).
 */
export async function skipExercise(
  ref: SessionExerciseRef,
  store: WorkoutStore,
): Promise<SessionExercise> {
  return store.transaction(async (repos) => {
    const { sessionExercise } = await openSessionExercise(ref, repos);
    if (sessionExercise.status === 'skipped') {
      return sessionExercise;
    }
    return repos.sessionExerciseRepo.update({ ...sessionExercise, status: 'skipped' });
  });
}

/**
 * Unskips the exercise `ref` points at: back to `planned`, or `completed` if every row is logged.
 * Its unlogged rows are editable again. An exercise that isn't skipped is left as it is.
 *
 * Rejects as `openSessionExercise` does.
 */
export async function unskipExercise(
  ref: SessionExerciseRef,
  store: WorkoutStore,
): Promise<SessionExercise> {
  return store.transaction(async (repos) => {
    const { sessionExercise } = await openSessionExercise(ref, repos);
    if (sessionExercise.status !== 'skipped') {
      return sessionExercise;
    }
    const logs = await repos.setLogRepo.listBySessionExerciseId(sessionExercise.id);
    return repos.sessionExerciseRepo.update({
      ...sessionExercise,
      status: statusFromLogs(sessionExercise, logs),
    });
  });
}
