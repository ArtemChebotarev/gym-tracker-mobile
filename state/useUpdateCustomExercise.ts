// Edits a custom exercise through the usecase layer via TanStack Query — 08.6 · Библиотека
// упражнений, "Тот же лист используется для редактирования custom-упражнения". The counterpart of
// useCreateCustomExercise.ts, invalidating the same library query plus the Exercise screen's own
// overview, which shows the name and group being edited.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { UpdateCustomExerciseInput } from '@usecases/exerciseLibrary';
import { updateCustomExercise } from '@usecases/exerciseLibrary';

import { useExerciseLibraryDeps } from './exerciseLibraryStore';

export function useUpdateCustomExercise() {
  const queryClient = useQueryClient();
  const deps = useExerciseLibraryDeps();

  return useMutation({
    mutationFn: (input: UpdateCustomExerciseInput) =>
      updateCustomExercise(input, deps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exerciseLibrary'] });
      queryClient.invalidateQueries({ queryKey: ['exerciseOverview'] });
    },
  });
}
