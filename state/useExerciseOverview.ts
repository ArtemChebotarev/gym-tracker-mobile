// Reads the Exercise screen's Overview tab through the usecase layer via TanStack Query — same
// pattern as useExerciseLibrary.ts. See 08.6 · Библиотека упражнений, "Exercise — вкладка
// Overview" (task 065).

import { useQuery } from '@tanstack/react-query';

import type { ExerciseId } from '@domain/catalog';
import { loadExerciseOverview } from '@usecases/exerciseOverview';

import { exerciseOverviewDeps } from './exerciseLibraryStore';

export function useExerciseOverview(exerciseId: ExerciseId) {
  return useQuery({
    queryKey: ['exerciseOverview', exerciseId],
    queryFn: () => loadExerciseOverview(exerciseId, exerciseOverviewDeps()),
  });
}
