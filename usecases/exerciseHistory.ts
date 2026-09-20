// The Exercise screen's History tab (06 · History & Analytics, Сценарий 2; task 108). Reads the
// exercise's performances through the repository and hands them to the domain builder; the
// grouping itself is the domain's, per usecases/README.md and 06 ("Агрегаты считаются в доменном
// слое поверх сырых данных").

import type { ExerciseId } from '@domain/catalog';
import type { ExerciseHistoryMesocycle } from '@domain/exerciseHistory';
import { buildExerciseHistory } from '@domain/exerciseHistoryBuilders';
import type { ExerciseHistoryRepository } from '@repositories/exerciseHistory';

export type ExerciseHistoryDeps = {
  exerciseHistoryRepo: ExerciseHistoryRepository;
};

/**
 * Every completed session of `exerciseId`, newest first, grouped by mesocycle. Empty when the
 * exercise was never performed — and equally when it doesn't exist at all: the screen only asks
 * for this once its overview resolved, so there is no separate "not found" here.
 */
export async function loadExerciseHistory(
  exerciseId: ExerciseId,
  deps: ExerciseHistoryDeps,
): Promise<ExerciseHistoryMesocycle[]> {
  const performances = await deps.exerciseHistoryRepo.listByExerciseId(exerciseId);
  return buildExerciseHistory(performances);
}
