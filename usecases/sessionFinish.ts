// Finish workout — task 050 (05 · Workout Execution & Logging, "Завершение тренировки",
// "Завершение как триггер генерации"). Finishing is where logging hands over to the engine: the
// session's final status and next week's session of the same day are written in one transaction.
// A final status is irreversible, so a generated session is never recalculated.

import { ConflictError } from '@domain/errors';
import type { Session } from '@domain/execution';
import { nowAsUtcIso } from '@domain/time';
import type { WorkoutStore } from '@repositories/workout';
import {
  generateNextSession,
  type NextSessionGenerationDeps,
} from '@usecases/nextSessionGeneration';
import { openSession } from '@usecases/openSession';

export type SessionFinishDeps = NextSessionGenerationDeps & { workout: WorkoutStore };

export type SessionFinishResult = {
  session: Session;
  /** Next week's session of the same day, or `null` after the deload week. */
  nextSession: Session | null;
};

/**
 * Finishes session `sessionId`. Every exercise must be `completed` or `skipped` — the Finish
 * button only appears then. With at least one logged set the session becomes `completed` with
 * `completedAt = now`; with none (every exercise skipped before a set was logged) it becomes
 * `skipped`. Either way next week's session of the same day is generated in the same transaction
 * (none after deload).
 *
 * Rejects with `ConflictError` if an exercise is still `planned` or the session is already final
 * or `awaiting_source`, and with `NotFoundError` if it doesn't exist; nothing is written then.
 */
export async function finishSession(
  sessionId: string,
  deps: SessionFinishDeps,
  now: string = nowAsUtcIso(),
): Promise<SessionFinishResult> {
  return deps.workout.transaction(async (repos) => {
    const { session, sessionExercises } = await openSession(sessionId, repos);
    const unfinished = sessionExercises.filter((exercise) => exercise.status === 'planned');
    if (unfinished.length > 0) {
      throw new ConflictError(
        `Session "${sessionId}" has ${unfinished.length} exercise(s) neither completed nor skipped.`,
      );
    }

    const logs = await repos.setLogRepo.listBySessionId(sessionId);
    const finished = await repos.sessionRepo.update(
      logs.length > 0
        ? { ...session, status: 'completed', completedAt: now }
        : { ...session, status: 'skipped' },
    );
    return { session: finished, nextSession: await generateNextSession(finished, repos, deps) };
  });
}
