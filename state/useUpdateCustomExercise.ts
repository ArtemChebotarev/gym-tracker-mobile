// Edits a custom exercise through the usecase layer via TanStack Query — 08.6 · Библиотека
// упражнений, "Тот же лист используется для редактирования custom-упражнения". The counterpart of
// useCreateCustomExercise.ts, invalidating the same library query plus the Exercise screen's own
// overview, which shows the name and group being edited.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { UpdateCustomExerciseInput } from '@usecases/exerciseLibrary';
import { updateCustomExercise } from '@usecases/exerciseLibrary';

import { exerciseLibraryDeps } from './exerciseLibraryStore';

export function useUpdateCustomExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCustomExerciseInput) =>
      updateCustomExercise(input, exerciseLibraryDeps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exerciseLibrary'] });
      queryClient.invalidateQueries({ queryKey: ['exerciseOverview'] });
    },
  });
}
