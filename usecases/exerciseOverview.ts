// The Exercise screen's Overview tab (08.6 · Библиотека упражнений, task 065). Reads the exercise
// and its performances through the repositories and hands both to the domain builder; the
// aggregation itself is the domain's, per usecases/README.md and 06 · History & Analytics
// ("Агрегаты считаются в доменном слое поверх сырых данных").

import type { ExerciseId } from '@domain/catalog';
import type { ExerciseOverview } from '@domain/exerciseOverview';
import { buildExerciseOverview } from '@domain/exerciseOverviewBuilders';
import type { ExerciseRepository } from '@repositories/catalog';
import type { ExerciseHistoryRepository } from '@repositories/exerciseHistory';

export type ExerciseOverviewDeps = {
  exerciseRepo: ExerciseRepository;
  exerciseHistoryRepo: ExerciseHistoryRepository;
};

/**
 * The Overview model for `exerciseId`, or `null` when no such exercise exists — the screen then
 * shows its "not found" state rather than an empty overview.
 *
 * A hidden exercise still resolves: hiding takes it out of every picker, but the screen stays
 * readable through the history that already links to it (08.6, "Меню и действия").
 */
export async function loadExerciseOverview(
  exerciseId: ExerciseId,
  deps: ExerciseOverviewDeps,
): Promise<ExerciseOverview | null> {
  const exercise = await deps.exerciseRepo.getById(exerciseId);
  if (!exercise) {
    return null;
  }
  const performances = await deps.exerciseHistoryRepo.listByExerciseId(exerciseId);
  return buildExerciseOverview(exercise, performances);
}
