// Exercise swap use case — task 047 (05 · Workout Execution & Logging, "Заменить упражнение";
// 08.7, "Меню упражнения"). A swap must never rewrite what was actually done: past weeks keep their
// set logs under their own `exerciseId`, and within the current session one session exercise only
// ever holds sets of one exercise. Orchestration only — the targets come from rule 6
// (`targetsFromHistory`).

import { toExerciseId } from '@domain/catalog';
import { NotFoundError } from '@domain/errors';
import type { SessionExercise } from '@domain/execution';
import { nowAsUtcIso } from '@domain/time';
import type { ExerciseRepository } from '@repositories/catalog';
import type { MesocycleRepository } from '@repositories/mesocycle';
import type { WorkoutStore } from '@repositories/workout';
import { targetsFromHistory } from '@usecases/historyTargets';
import { openSessionExercise, type SessionExerciseRef } from '@usecases/openSession';

export type ExerciseSwapDeps = {
  workout: WorkoutStore;
  mesocycleRepo: MesocycleRepository;
  /** Reads the new exercise's equipment — a pure bodyweight one gets no weight target (105). */
  exerciseRepo: ExerciseRepository;
};

export type ExerciseSwapInput = SessionExerciseRef & {
  /** The exercise picked in `ExercisePickerSheet` (`single` mode). */
  exerciseId: string;
};

/**
 * Swaps session exercise `sessionExerciseId` to `exerciseId`, in one transaction:
 *
 * - An exercise already started in this session loses its set logs here — the screen has asked
 *   for a danger confirmation first — and goes back to `planned` (as does a skipped one: it's a
 *   different exercise now, not yet done).
 * - Every row gets rule 6 targets for the new exercise; with no reference they're cleared and the
 *   screen shows `N RIR`. The row count and `targetRir` stay as they were.
 *
 * Swapping to the exercise it already is changes nothing. Swap history isn't kept, and later weeks
 * inherit the new exercise from this session's fact when they're generated (03, "Структура
 * наследуется от факта").
 *
 * Rejects with `NotFoundError` if the session, its mesocycle or the session exercise doesn't
 * exist, and with `ConflictError` if the session is final or `awaiting_source`.
 */
export async function swapExercise(
  input: ExerciseSwapInput,
  deps: ExerciseSwapDeps,
  now: string = nowAsUtcIso(),
): Promise<SessionExercise> {
  return deps.workout.transaction(async (repos) => {
    const { session, sessionExercise: current } = await openSessionExercise(input, repos);
    if (current.exerciseId === input.exerciseId) {
      return current;
    }

    const mesocycle = await deps.mesocycleRepo.getById(session.mesoId);
    if (!mesocycle) {
      throw new NotFoundError(`Mesocycle "${session.mesoId}" does not exist.`);
    }

    const startedSets = await repos.setLogRepo.listBySessionExerciseId(current.id);
    for (const setLog of startedSets) {
      await repos.setLogRepo.deleteById(setLog.id);
    }

    const swappedIn = await deps.exerciseRepo.getById(toExerciseId(input.exerciseId));
    const setTargets = await targetsFromHistory(
      {
        exerciseId: input.exerciseId,
        session,
        rowCount: current.setTargets.length,
        sessionExerciseId: current.id,
        settings: mesocycle.progressionSettings,
        equipment: swappedIn?.equipment,
        now,
      },
      repos.setLogRepo,
    );
    return repos.sessionExerciseRepo.update({
      ...current,
      exerciseId: input.exerciseId,
      setTargets,
      status: 'planned',
    });
  });
}
