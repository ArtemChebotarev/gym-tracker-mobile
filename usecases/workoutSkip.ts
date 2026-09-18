// Skip workout — the session half of task 049 (05 · Workout Execution & Logging, "Пропустить
// тренировку"; 08.7, "Меню шапки"). A skipped session is final and, like a finished one,
// triggers next week's session of the same day — planned from the last completed session of that
// day, or week 1's start values (03, "Ленивая генерация по дням").

import { ConflictError } from '@domain/errors';
import type { Session } from '@domain/execution';
import type { WorkoutStore } from '@repositories/workout';
import {
  generateNextSession,
  type NextSessionGenerationDeps,
} from '@usecases/nextSessionGeneration';
import { openSession } from '@usecases/openSession';

export type WorkoutSkipDeps = NextSessionGenerationDeps & { workout: WorkoutStore };

export type WorkoutSkipResult = {
  session: Session;
  /** Next week's session of the same day, or `null` after the deload week. */
  nextSession: Session | null;
};

/**
 * Skips session `sessionId` and generates next week's session of the same day, in one
 * transaction. Only a session with no logged set can be skipped — one with sets goes through
 * Finish (050) instead.
 *
 * Rejects with `ConflictError` if a set is logged or the session is final or `awaiting_source`,
 * and with `NotFoundError` if it doesn't exist; nothing is written then.
 */
export async function skipWorkout(
  sessionId: string,
  deps: WorkoutSkipDeps,
): Promise<WorkoutSkipResult> {
  return deps.workout.transaction(async (repos) => {
    const { session } = await openSession(sessionId, repos);
    const logs = await repos.setLogRepo.listBySessionId(sessionId);
    if (logs.length > 0) {
      throw new ConflictError(
        `Session "${sessionId}" has ${logs.length} logged set(s); finish it instead of skipping.`,
      );
    }

    const skipped = await repos.sessionRepo.update({ ...session, status: 'skipped' });
    return { session: skipped, nextSession: await generateNextSession(skipped, repos, deps) };
  });
}
