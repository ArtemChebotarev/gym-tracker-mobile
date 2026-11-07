// What kind of training a session was (GT-247) — for the `workout_completed` telemetry event. Only
// the exercises actually done count: a hybrid exercise skipped on a strength day leaves it a
// strength day.

import { toExerciseId } from '@domain/catalog';
import { exerciseTypeOf } from '@domain/exerciseConfigBuilders';
import type { WorkoutKind } from '@domain/workoutKind';
import { workoutKindOf } from '@domain/workoutKindRules';
import type { ExerciseRepository } from '@repositories/catalog';
import type { WorkoutStore } from '@repositories/workout';

export type WorkoutKindDeps = { workout: WorkoutStore; exerciseRepo: ExerciseRepository };

/** The kind of session `sessionId`, judged by its `completed` exercises. Reads only. */
export async function sessionWorkoutKind(
  sessionId: string,
  deps: WorkoutKindDeps,
): Promise<WorkoutKind> {
  const sessionExercises = await deps.workout.repos.sessionExerciseRepo.listBySessionId(sessionId);
  const done = sessionExercises.filter((exercise) => exercise.status === 'completed');
  const catalog = await deps.exerciseRepo.listByIds(
    done.map((exercise) => toExerciseId(exercise.exerciseId)),
  );
  return workoutKindOf(catalog.map(exerciseTypeOf));
}
