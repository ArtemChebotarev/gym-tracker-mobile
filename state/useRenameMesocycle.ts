// Renames a mesocycle through the usecase layer via TanStack Query — task 087 (05 · Workout
// Execution & Logging, "Переименовать мезоцикл"). Opened from the workout header menu (096).
//
// The name is on screen in two places at once, so both are invalidated: the workout queries, for
// the header's subtitle and the mesocycle overview sheet above it, and `mesocycles`, for the list
// on the Mesocycles tab.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { renameMesocycle } from '@usecases/mesocycleEditing';

import { useMesocycleEditingDeps } from './mesocycleStore';
import { invalidateWorkoutQueries } from './useWorkoutSession';

export type RenameMesocycleInput = {
  mesoId: string;
  name: string;
};

export function useRenameMesocycle() {
  const queryClient = useQueryClient();
  const deps = useMesocycleEditingDeps();

  return useMutation({
    mutationFn: ({ mesoId, name }: RenameMesocycleInput) => renameMesocycle(mesoId, name, deps),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mesocycles'] }),
        invalidateWorkoutQueries(queryClient),
      ]),
  });
}
