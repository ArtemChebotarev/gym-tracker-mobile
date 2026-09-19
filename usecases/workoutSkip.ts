// Skip workout — the session half of task 049 (05 · Workout Execution & Logging, "Пропустить
// тренировку"; 08.7, "Меню шапки"), reworked in task 096. Skipping ends the session wherever it
// stands: every exercise not yet `completed` is skipped — its logged sets stay, the rest of its
// rows count as skipped (05, "Пропустить упражнение") — and the session then closes the way Finish
// closes it: `completed` if any set is logged, else `skipped`. Either way it triggers next week's
// session of the same day (03, "Ленивая генерация по дням").

import { nowAsUtcIso } from '@domain/time';
import type { WorkoutStore } from '@repositories/workout';
import type { NextSessionGenerationDeps } from '@usecases/nextSessionGeneration';
import { openSession } from '@usecases/openSession';
import { closeSession, type SessionFinishResult } from '@usecases/sessionFinish';

export type WorkoutSkipDeps = NextSessionGenerationDeps & { workout: WorkoutStore };

export type WorkoutSkipResult = SessionFinishResult;

/**
 * Skips session `sessionId`, in one transaction: each `planned` exercise becomes `skipped`
 * (`completed` and already skipped ones are left as they are, and no set log is touched), the
 * session becomes `completed` with `completedAt = now` if it has a logged set and `skipped`
 * otherwise, and next week's session of the same day is generated (none after deload).
 *
 * Rejects with `ConflictError` if the session is final or `awaiting_source`, and with
 * `NotFoundError` if it doesn't exist; nothing is written then.
 */
export async function skipWorkout(
  sessionId: string,
  deps: WorkoutSkipDeps,
  now: string = nowAsUtcIso(),
): Promise<WorkoutSkipResult> {
  return deps.workout.transaction(async (repos) => {
    const { session, sessionExercises } = await openSession(sessionId, repos);
    for (const exercise of sessionExercises) {
      if (exercise.status === 'planned') {
        await repos.sessionExerciseRepo.update({ ...exercise, status: 'skipped' });
      }
    }
    return closeSession(session, repos, deps, now);
  });
}
