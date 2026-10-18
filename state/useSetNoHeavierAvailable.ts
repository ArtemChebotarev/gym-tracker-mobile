// Sets the power flag "No heavier available" through the usecase layer via TanStack Query — 10.2
// P9 (GT-81). The workout screen is the one that shows the hint, so its queries are re-read; the
// exercise's own overview carries its config too.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ExerciseId } from '@domain/catalog';
import { setNoHeavierAvailable } from '@usecases/exerciseLibrary';

import { useExerciseLibraryDeps } from './exerciseLibraryStore';
import { invalidateWorkoutQueries } from './useWorkoutSession';

export function useSetNoHeavierAvailable() {
  const queryClient = useQueryClient();
  const deps = useExerciseLibraryDeps();

  return useMutation({
    meta: { operation: 'setNoHeavierAvailable' },
    mutationFn: ({ id, value }: { id: ExerciseId; value: boolean }) =>
      setNoHeavierAvailable(id, value, deps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exerciseLibrary'] });
      queryClient.invalidateQueries({ queryKey: ['exerciseOverview'] });
      return invalidateWorkoutQueries(queryClient);
    },
  });
}
