// Move an exercise up or down — the reorder half of task 048 (05 · Workout Execution & Logging,
// "Изменить порядок упражнений"). The next week inherits the new order from this session's fact
// (03, "Структура наследуется от факта"). Orchestration only — the swap lives in
// `domain/sessionExerciseOrder.ts`.

import type { SessionExercise } from '@domain/execution';
import { type MoveDirection, swappedWithNeighbour } from '@domain/sessionExerciseOrder';
import type { WorkoutStore } from '@repositories/workout';
import { openSessionExercise, type SessionExerciseRef } from '@usecases/openSession';

/**
 * Swaps the `order` of the exercise `ref` points at with its neighbour `direction`, in one
 * transaction, and resolves to the session's exercises in their new order.
 *
 * Rejects with `ConflictError` when the exercise is already first (up) or last (down), and as
 * `openSessionExercise` does otherwise (missing, or the session is final or `awaiting_source`).
 */
export async function moveExercise(
  ref: SessionExerciseRef,
  direction: MoveDirection,
  store: WorkoutStore,
): Promise<SessionExercise[]> {
  return store.transaction(async (repos) => {
    const { sessionExercises } = await openSessionExercise(ref, repos);
    const swapped = swappedWithNeighbour(sessionExercises, ref.sessionExerciseId, direction);
    await repos.sessionExerciseRepo.updateMany(swapped);

    const updated = new Map(swapped.map((exercise) => [exercise.id, exercise]));
    return sessionExercises
      .map((exercise) => updated.get(exercise.id) ?? exercise)
      .sort((a, b) => a.order - b.order);
  });
}
