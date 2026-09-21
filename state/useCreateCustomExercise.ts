// Creates a custom exercise through the usecase layer via TanStack Query — see state/README.md
// and 08.6 · Библиотека упражнений ("New exercise — лист"). Invalidates the exercise-library
// query on success so the list (and any open Filters sheet) picks up the new exercise without a
// manual refetch.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreateCustomExerciseInput } from '@usecases/exerciseLibrary';
import { createCustomExercise } from '@usecases/exerciseLibrary';

import { useExerciseLibraryDeps } from './exerciseLibraryStore';

export function useCreateCustomExercise() {
  const queryClient = useQueryClient();
  const deps = useExerciseLibraryDeps();

  return useMutation({
    mutationFn: (input: CreateCustomExerciseInput) => createCustomExercise(input, deps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exerciseLibrary'] });
    },
  });
}
