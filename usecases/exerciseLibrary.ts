// Exercise-library use cases — called by the library screens (08.6 · Библиотека упражнений).
// Orchestrates domain validation/listing with the catalog and set-log repositories; contains no
// business logic of its own, per usecases/README.md.

import {
  toExerciseId,
  type Equipment,
  type Exercise,
  type ExerciseId,
  type ExerciseType,
  type MuscleGroup,
} from '@domain/catalog';
import {
  buildExerciseListGroups,
  type ExerciseListGroup,
  type ExerciseListQuery,
} from '@domain/catalogListing';
import {
  normalizeExerciseName,
  validateEquipmentForType,
  validateExerciseEquipment,
} from '@domain/catalogValidators';
import { ConflictError, NotFoundError } from '@domain/errors';
import type { SetLog } from '@domain/execution';
import type { ExerciseConfig } from '@domain/exerciseConfig';
import { defaultExerciseConfig, exerciseTypeOf } from '@domain/exerciseConfigBuilders';
import {
  assertTypeUnchanged,
  validateExerciseConfig,
  validateExerciseMuscleGroupFor,
  validateExerciseType,
} from '@domain/exerciseConfigValidators';
import { generateId } from '@domain/id';
import type { ExerciseRepository } from '@repositories/catalog';
import type { RoundLogRepository } from '@repositories/roundLogRepository';
import type { SetLogRepository } from '@repositories/setLogRepository';

export type ExerciseLibraryDeps = {
  exerciseRepo: ExerciseRepository;
  setLogRepo: SetLogRepository;
  roundLogRepo: RoundLogRepository;
};

export type CreateCustomExerciseInput = {
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: Equipment;
  /** Absent means `strength`. */
  type?: ExerciseType;
  /** Absent means the type's system defaults (`defaultExerciseConfig`). */
  config?: ExerciseConfig;
};

export type UpdateCustomExerciseInput = {
  id: ExerciseId;
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: Equipment;
  /** Absent leaves the exercise's type as it is. */
  type?: ExerciseType;
  /** Absent leaves the config as it is — or, if the type changes, takes the new type's defaults. */
  config?: ExerciseConfig;
};

/**
 * `type` and `config` as they go onto an exercise: a strength exercise carries neither key, so
 * what is stored for one is exactly what was stored before the hybrid types existed.
 */
function typeFields(
  type: ExerciseType,
  config: ExerciseConfig | undefined,
): Pick<Exercise, 'type' | 'config'> {
  return type === 'strength' ? {} : { type, config };
}

/** Creates a custom exercise (08.6, "New exercise — лист"). */
export async function createCustomExercise(
  input: CreateCustomExerciseInput,
  deps: Pick<ExerciseLibraryDeps, 'exerciseRepo'>,
): Promise<Exercise> {
  const name = normalizeExerciseName(input.name);
  const type = input.type ?? 'strength';
  validateExerciseType(type);
  validateExerciseMuscleGroupFor(type, input.muscleGroup);
  validateExerciseEquipment(input.equipment);
  validateEquipmentForType(type, input.equipment);
  const config = input.config ?? defaultExerciseConfig(type);
  validateExerciseConfig(type, config);

  return deps.exerciseRepo.createCustom({
    id: toExerciseId(generateId()),
    name,
    muscleGroup: input.muscleGroup,
    source: 'custom',
    equipment: input.equipment,
    isHidden: false,
    ...typeFields(type, config),
  });
}

/**
 * Edits an existing custom exercise. Rejects with `NotFoundError` if `input.id` doesn't exist,
 * or `ConflictError` if it isn't a custom exercise (08.6: "Каталожное упражнение открыть в этом
 * листе нельзя") or if its type is being changed while anything — a set or a round — has been
 * logged for it (10 · Hybrid Exercises).
 */
export async function updateCustomExercise(
  input: UpdateCustomExerciseInput,
  deps: ExerciseLibraryDeps,
): Promise<Exercise> {
  const existing = await deps.exerciseRepo.getById(input.id);
  if (!existing) {
    throw new NotFoundError(`Exercise "${input.id}" does not exist.`);
  }
  if (existing.source !== 'custom') {
    throw new ConflictError(`Exercise "${input.id}" is a catalog exercise and cannot be edited.`);
  }

  const name = normalizeExerciseName(input.name);
  const currentType = exerciseTypeOf(existing);
  const type = input.type ?? currentType;
  validateExerciseType(type);
  if (type !== currentType) {
    // Only asked when the type is actually changing — a rename shouldn't cost two reads.
    const [lastSet, lastRound] = await Promise.all([
      deps.setLogRepo.getLastByExerciseId(existing.id),
      deps.roundLogRepo.getLastByExerciseId(existing.id),
    ]);
    assertTypeUnchanged(currentType, type, lastSet !== null || lastRound !== null);
  }
  validateExerciseMuscleGroupFor(type, input.muscleGroup);
  validateExerciseEquipment(input.equipment);
  validateEquipmentForType(type, input.equipment);
  // A changed type brings its own defaults — the old config is the old type's. An unchanged one
  // keeps what it has unless the caller sends a new one.
  const config =
    input.config ?? (type === currentType ? existing.config : defaultExerciseConfig(type));
  validateExerciseConfig(type, config);

  const { type: _type, config: _config, ...rest } = existing;
  return deps.exerciseRepo.updateCustom({
    ...rest,
    name,
    muscleGroup: input.muscleGroup,
    equipment: input.equipment,
    ...typeFields(type, config),
  });
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

/**
 * Resolves a set of exercise ids to their `Exercise` records — e.g. the mesocycle editor's Days
 * & exercises step (08.5, "Шаг 2") rendering each `WeekPlanExercise.exerciseId` it holds as a
 * name/muscle-group row. Ids that don't resolve are silently omitted, same as
 * `ExerciseRepository.listByIds` itself.
 */
export async function listExercisesByIds(
  ids: readonly ExerciseId[],
  deps: Pick<ExerciseLibraryDeps, 'exerciseRepo'>,
): Promise<Exercise[]> {
  return deps.exerciseRepo.listByIds(ids);
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
