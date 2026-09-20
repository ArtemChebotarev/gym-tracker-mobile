// Add unplanned exercises — the add half of task 048 (05 · Workout Execution & Logging, "Добавить
// внеплановое упражнение"; 08.7, "Меню шапки" → Add exercise). An added exercise becomes an
// ordinary part of the session, so the next week inherits it (03, "Структура наследуется от
// факта"). Orchestration only — targets come from rule 6 (`targetsFromHistory`), the week's RIR
// from rule 4.

import { toExerciseId, type Equipment } from '@domain/catalog';
import { ConflictError, NotFoundError } from '@domain/errors';
import type { SessionExercise } from '@domain/execution';
import { generateId } from '@domain/id';
import { targetRir } from '@domain/progressionRir';
import { nextOrder } from '@domain/sessionExerciseOrder';
import { ADDED_EXERCISE_SET_COUNT } from '@domain/sessionExerciseSets';
import { nowAsUtcIso } from '@domain/time';
import type { ExerciseRepository } from '@repositories/catalog';
import type { MesocycleRepository } from '@repositories/mesocycle';
import type { WorkoutStore } from '@repositories/workout';
import { targetsFromHistory } from '@usecases/historyTargets';
import { openSession } from '@usecases/openSession';

export type ExerciseAdditionDeps = {
  workout: WorkoutStore;
  mesocycleRepo: MesocycleRepository;
  /** Reads each added exercise's equipment — a pure bodyweight one gets no weight target (105). */
  exerciseRepo: ExerciseRepository;
};

export type ExerciseAdditionInput = {
  sessionId: string;
  /** The exercises picked in `ExercisePickerSheet` (`multi` mode), in the order they're added. */
  exerciseIds: readonly string[];
};

/**
 * Appends one session exercise per `exerciseIds` entry to the end of the session, in one
 * transaction: 2 set rows with rule 6 targets from the exercise's last performance (none → the
 * screen shows `N RIR`), the week's `targetRir`, status `planned`. Resolves to the new session
 * exercises, in order.
 *
 * Rejects with `ConflictError` in a deload session (03, rule 6: nothing can be added there) and in
 * a final or `awaiting_source` one, and with `NotFoundError` if the session or its mesocycle
 * doesn't exist.
 */
export async function addExercises(
  input: ExerciseAdditionInput,
  deps: ExerciseAdditionDeps,
  now: string = nowAsUtcIso(),
): Promise<SessionExercise[]> {
  return deps.workout.transaction(async (repos) => {
    const { session, sessionExercises } = await openSession(input.sessionId, repos);
    if (session.isDeload) {
      throw new ConflictError(
        `Session "${session.id}" is a deload session; exercises can't be added.`,
      );
    }
    const mesocycle = await deps.mesocycleRepo.getById(session.mesoId);
    if (!mesocycle) {
      throw new NotFoundError(`Mesocycle "${session.mesoId}" does not exist.`);
    }

    const catalog = await deps.exerciseRepo.listByIds(input.exerciseIds.map(toExerciseId));
    const equipmentById = new Map<string, Equipment | undefined>(
      catalog.map((exercise) => [exercise.id as string, exercise.equipment]),
    );
    const weekRir = targetRir(mesocycle.lengthWeeks, session.weekNumber);
    const firstOrder = nextOrder(sessionExercises);
    const added: SessionExercise[] = [];
    for (const [index, exerciseId] of input.exerciseIds.entries()) {
      added.push({
        id: generateId(),
        sessionId: session.id,
        exerciseId,
        order: firstOrder + index,
        setTargets: await targetsFromHistory(
          {
            exerciseId,
            session,
            rowCount: ADDED_EXERCISE_SET_COUNT,
            settings: mesocycle.progressionSettings,
            equipment: equipmentById.get(exerciseId),
            now,
          },
          repos.setLogRepo,
        ),
        targetRir: weekRir,
        status: 'planned',
      });
    }
    return repos.sessionExerciseRepo.createMany(added);
  });
}
