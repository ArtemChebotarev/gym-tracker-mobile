// Closes a power exercise's note at the top of its corridor for good through the usecase layer via
// TanStack Query — GT-81. The workout screen shows the note, so its queries are re-read.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ExerciseId } from '@domain/catalog';
import { hideCeilingTip } from '@usecases/exerciseLibrary';

import { useExerciseLibraryDeps } from './exerciseLibraryStore';
import { invalidateWorkoutQueries } from './useWorkoutSession';

export function useHideCeilingTip() {
  const queryClient = useQueryClient();
  const deps = useExerciseLibraryDeps();

  return useMutation({
    meta: { operation: 'hideCeilingTip' },
    mutationFn: (id: ExerciseId) => hideCeilingTip(id, deps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exerciseLibrary'] });
      queryClient.invalidateQueries({ queryKey: ['exerciseOverview'] });
      return invalidateWorkoutQueries(queryClient);
    },
  });
}
