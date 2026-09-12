// Exercise-library use cases — called by the library screens (08.6 · Библиотека упражнений).
// Orchestrates domain validation/listing with the catalog and set-log repositories; contains no
// business logic of its own, per usecases/README.md.

import { toExerciseId, type Exercise, type ExerciseId, type MuscleGroup } from '@domain/catalog';
import {
  buildExerciseListGroups,
  type ExerciseListGroup,
  type ExerciseListQuery,
} from '@domain/catalogListing';
import { normalizeExerciseName, validateExerciseMuscleGroup } from '@domain/catalogValidators';
import { ConflictError, NotFoundError } from '@domain/errors';
import type { SetLog } from '@domain/execution';
import { generateId } from '@domain/id';
import type { ExerciseRepository } from '@repositories/catalog';
import type { SetLogRepository } from '@repositories/setLogRepository';

export type ExerciseLibraryDeps = {
  exerciseRepo: ExerciseRepository;
  setLogRepo: SetLogRepository;
};

export type CreateCustomExerciseInput = {
  name: string;
  muscleGroup: MuscleGroup;
};

export type UpdateCustomExerciseInput = {
  id: ExerciseId;
  name: string;
  muscleGroup: MuscleGroup;
};

/** Creates a custom exercise (08.6, "New exercise — лист"). */
export async function createCustomExercise(
  input: CreateCustomExerciseInput,
  deps: Pick<ExerciseLibraryDeps, 'exerciseRepo'>,
): Promise<Exercise> {
  const name = normalizeExerciseName(input.name);
  validateExerciseMuscleGroup(input.muscleGroup);

  return deps.exerciseRepo.createCustom({
    id: toExerciseId(generateId()),
    name,
    muscleGroup: input.muscleGroup,
    source: 'custom',
    isHidden: false,
  });
}

/**
 * Edits an existing custom exercise. Rejects with `NotFoundError` if `input.id` doesn't exist,
 * or `ConflictError` if it isn't a custom exercise (08.6: "Каталожное упражнение открыть в этом
 * листе нельзя").
 */
export async function updateCustomExercise(
  input: UpdateCustomExerciseInput,
  deps: Pick<ExerciseLibraryDeps, 'exerciseRepo'>,
): Promise<Exercise> {
  const existing = await deps.exerciseRepo.getById(input.id);
  if (!existing) {
    throw new NotFoundError(`Exercise "${input.id}" does not exist.`);
  }
  if (existing.source !== 'custom') {
    throw new ConflictError(`Exercise "${input.id}" is a catalog exercise and cannot be edited.`);
  }

  const name = normalizeExerciseName(input.name);
  validateExerciseMuscleGroup(input.muscleGroup);

  return deps.exerciseRepo.updateCustom({ ...existing, name, muscleGroup: input.muscleGroup });
}

/**
 * Hides an exercise, catalog or custom (08.6: "`Hide` выставляет `isHidden = true`"). Idempotent
 * — hiding an already-hidden exercise is a no-op, since `ExerciseRepository.toggleHidden` flips
 * the flag rather than setting it.
 */
export async function hideExercise(
  id: ExerciseId,
  deps: Pick<ExerciseLibraryDeps, 'exerciseRepo'>,
): Promise<Exercise> {
  const existing = await deps.exerciseRepo.getById(id);
  if (!existing) {
    throw new NotFoundError(`Exercise "${id}" does not exist.`);
  }
  if (existing.isHidden) {
    return existing;
  }
  return deps.exerciseRepo.toggleHidden(id);
}

/** Builds the grouped, filtered, searched exercise list (08.6, "Exercises — список"). */
export async function listExerciseGroups(
  query: ExerciseListQuery,
  deps: ExerciseLibraryDeps,
): Promise<ExerciseListGroup[]> {
  const exercises = await deps.exerciseRepo.getAll();

  const lastSetLogEntries = await Promise.all(
    exercises.map(async (exercise): Promise<[string, SetLog | null]> => {
      const lastSetLog = await deps.setLogRepo.getLastByExerciseId(exercise.id);
      return [exercise.id, lastSetLog];
    }),
  );

  return buildExerciseListGroups(exercises, new Map(lastSetLogEntries), query);
}
