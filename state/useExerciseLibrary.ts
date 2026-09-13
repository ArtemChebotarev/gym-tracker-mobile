// Reads the exercise library through the usecase layer via TanStack Query — see
// state/README.md ("TanStack Query for reading data through usecases") and 08.6 · Библиотека
// упражнений ("Exercises — список"). Screens key off `query` themselves (search text, active
// filters); this hook only re-fetches when that key changes.

import { useQuery } from '@tanstack/react-query';

import type { ExerciseListQuery } from '@domain/catalogListing';
import { listExerciseGroups } from '@usecases/exerciseLibrary';

import { ensureExerciseCatalogSeeded, exerciseLibraryDeps } from './exerciseLibraryStore';

export function useExerciseLibrary(query: ExerciseListQuery) {
  return useQuery({
    queryKey: ['exerciseLibrary', query],
    queryFn: async () => {
      await ensureExerciseCatalogSeeded();
      return listExerciseGroups(query, exerciseLibraryDeps);
    },
  });
}
