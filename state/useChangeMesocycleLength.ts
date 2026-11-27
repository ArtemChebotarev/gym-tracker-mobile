// Changes the active block's length from the overview sheet — GT-240 (08.7, "Лист «Обзор
// мезоцикла»") — through the usecase layer via TanStack Query. A new length moves the deload and
// re-plans the generated sessions after the last started week, so every workout query re-reads, the
// grid with them, and the mesocycle list picks up the new `Week N of M`.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { changeMesocycleLength } from '@usecases/mesocycleLength';

import { useMesocycleLengthDeps } from './mesocycleStore';
import { invalidateWorkoutQueries } from './useWorkoutSession';

export type ChangeMesocycleLengthInput = { mesoId: string; lengthWeeks: number };

/** Sets the active block to `lengthWeeks` weeks — one tap of the sheet's Cycle length stepper. */
export function useChangeMesocycleLength() {
  const queryClient = useQueryClient();
  const deps = useMesocycleLengthDeps();

  return useMutation({
    meta: { operation: 'changeMesocycleLength' },
    mutationFn: ({ mesoId, lengthWeeks }: ChangeMesocycleLengthInput) =>
      changeMesocycleLength(mesoId, lengthWeeks, deps),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mesocycles'] }),
        invalidateWorkoutQueries(queryClient),
      ]),
  });
}
