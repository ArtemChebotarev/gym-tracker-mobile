// Reads the exercise library through the usecase layer via TanStack Query — see
// state/README.md ("TanStack Query for reading data through usecases") and 08.6 · Библиотека
// упражнений ("Exercises — список"). Screens key off `query` themselves (search text, active
// filters); this hook only re-fetches when that key changes. `enabled: false` holds the query off —
// for a sheet that stays mounted while hidden and has nothing to show until it opens.

import { useQuery } from '@tanstack/react-query';

import type { ExerciseListQuery } from '@domain/catalogListing';
import { listExerciseGroups } from '@usecases/exerciseLibrary';

import { useExerciseLibraryDeps } from './exerciseLibraryStore';

export function useExerciseLibrary(query: ExerciseListQuery, options: { enabled?: boolean } = {}) {
  const deps = useExerciseLibraryDeps();

  return useQuery({
    enabled: options.enabled ?? true,
    queryKey: ['exerciseLibrary', query],
    queryFn: () => listExerciseGroups(query, deps),
  });
}
