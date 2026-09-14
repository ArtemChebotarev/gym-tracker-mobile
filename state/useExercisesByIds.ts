// Resolves exercise ids to `Exercise` records through the usecase layer via TanStack Query —
// same pattern as useExerciseLibrary.ts. Used by the mesocycle editor's Days & exercises step
// (08.5, "Шаг 2") to render a name/muscle-group row for each `WeekPlanExercise.exerciseId` its
// draft holds.

import { useQuery } from '@tanstack/react-query';

import type { Exercise, ExerciseId } from '@domain/catalog';
import { listExercisesByIds } from '@usecases/exerciseLibrary';

import { ensureExerciseCatalogSeeded, exerciseLibraryDeps } from './exerciseLibraryStore';

/** Keyed by id for O(1) lookups from a screen's render — see `MesoEditorDaysStepLogic.ts`. */
export type ExercisesById = Record<string, Exercise>;

export function useExercisesByIds(ids: readonly ExerciseId[]) {
  return useQuery({
    queryKey: ['exercisesByIds', [...ids].sort()],
    queryFn: async (): Promise<ExercisesById> => {
      await ensureExerciseCatalogSeeded();
      const exercises = await listExercisesByIds(ids, exerciseLibraryDeps);
      return Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise]));
    },
  });
}
