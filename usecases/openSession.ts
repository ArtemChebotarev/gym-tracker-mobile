// Shared first step of every workout-screen action (05 · Workout Execution & Logging, "Действия
// во время тренировки"): read the session — and the exercise the action targets — and check the
// session still accepts changes. Called inside the action's transaction, with its repositories.

import { NotFoundError } from '@domain/errors';
import type { Session, SessionExercise } from '@domain/execution';
import { assertSessionOpen } from '@domain/sessionLifecycle';
import type { WorkoutRepositories } from '@repositories/workout';

/** One exercise of a session, as the screen addresses it. */
export type SessionExerciseRef = {
  sessionId: string;
  sessionExerciseId: string;
};

export type OpenSession = {
  session: Session;
  /** Every exercise of the session, in no particular order. */
  sessionExercises: SessionExercise[];
};

export type OpenSessionExercise = OpenSession & { sessionExercise: SessionExercise };

/**
 * Session `sessionId` with its exercises. Rejects with `NotFoundError` if it doesn't exist, and
 * with `ConflictError` if it's final or `awaiting_source` (`assertSessionOpen`).
 */
export async function openSession(
  sessionId: string,
  repos: WorkoutRepositories,
): Promise<OpenSession> {
  const session = await repos.sessionRepo.getById(sessionId);
  if (!session) {
    throw new NotFoundError(`Session "${sessionId}" does not exist.`);
  }
  assertSessionOpen(session);
  return { session, sessionExercises: await repos.sessionExerciseRepo.listBySessionId(sessionId) };
}

/**
 * `openSession` plus the exercise `ref` points at. Also rejects with `NotFoundError` if that
 * exercise isn't part of the session.
 */
export async function openSessionExercise(
  ref: SessionExerciseRef,
  repos: WorkoutRepositories,
): Promise<OpenSessionExercise> {
  const open = await openSession(ref.sessionId, repos);
  const sessionExercise = open.sessionExercises.find(
    (exercise) => exercise.id === ref.sessionExerciseId,
  );
  if (!sessionExercise) {
    throw new NotFoundError(
      `Session exercise "${ref.sessionExerciseId}" is not part of session "${ref.sessionId}".`,
    );
  }
  return { ...open, sessionExercise };
}
