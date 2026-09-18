// Remove an exercise from a session — task 086 (05 · Workout Execution & Logging, "Удалить
// упражнение"; 08.7, "Меню упражнения"). Unlike a skip, removal also takes the exercise out of
// later weeks: they inherit the session's structure at Finish, and a removed exercise simply isn't
// part of it (03, "Структура наследуется от факта"). Orchestration only — renumbering lives in
// `domain/sessionExerciseOrder.ts`.

import type { SessionExercise } from '@domain/execution';
import { renumbered } from '@domain/sessionExerciseOrder';
import type { WorkoutStore } from '@repositories/workout';
import { openSessionExercise, type SessionExerciseRef } from '@usecases/openSession';

/**
 * Removes the exercise `ref` points at from its session, in one transaction: its set logs in this
 * session (if it was started — the screen has warned about that in its danger confirmation), the
 * session exercise itself, and a renumbering of the remaining exercises' `order` with no gaps. Past
 * weeks' set logs of the same exercise belong to other session exercises and are untouched.
 *
 * Resolves to the session's remaining exercises in order. Rejects with `NotFoundError` /
 * `ConflictError` as `openSessionExercise` does (missing, or the session is final or
 * `awaiting_source`).
 */
export async function removeExercise(
  ref: SessionExerciseRef,
  store: WorkoutStore,
): Promise<SessionExercise[]> {
  return store.transaction(async (repos) => {
    const { sessionExercise, sessionExercises } = await openSessionExercise(ref, repos);

    const logs = await repos.setLogRepo.listBySessionExerciseId(sessionExercise.id);
    for (const log of logs) {
      await repos.setLogRepo.deleteById(log.id);
    }
    await repos.sessionExerciseRepo.deleteById(sessionExercise.id);

    const remaining = sessionExercises.filter((exercise) => exercise.id !== sessionExercise.id);
    const previousOrder = new Map(remaining.map((exercise) => [exercise.id, exercise.order]));
    const reordered = renumbered(remaining);
    const moved = reordered.filter((exercise) => exercise.order !== previousOrder.get(exercise.id));
    if (moved.length > 0) {
      await repos.sessionExerciseRepo.updateMany(moved);
    }
    return reordered;
  });
}
