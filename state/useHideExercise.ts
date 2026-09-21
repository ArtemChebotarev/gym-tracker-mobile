// Hides an exercise through the usecase layer via TanStack Query — 08.6 · Библиотека упражнений,
// "Меню и действия" ("`Hide` выставляет `isHidden = true`"). Invalidates the library list and the
// Exercise screen's own overview, so both stop showing it without a manual refetch.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ExerciseId } from '@domain/catalog';
import { hideExercise } from '@usecases/exerciseLibrary';

import { useExerciseLibraryDeps } from './exerciseLibraryStore';

export function useHideExercise() {
  const queryClient = useQueryClient();
  const deps = useExerciseLibraryDeps();

  return useMutation({
    mutationFn: (id: ExerciseId) => hideExercise(id, deps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exerciseLibrary'] });
      queryClient.invalidateQueries({ queryKey: ['exerciseOverview'] });
    },
  });
}
