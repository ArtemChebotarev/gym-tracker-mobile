// Closes a mesocycle through the usecase layer via TanStack Query — task 052 (04 · Meso Creation
// Flows, "Завершение мезоцикла"; 05, "Остановить мезоцикл"). Both ways out of a block live here,
// as `useLogSet` / `useUnlogSet` do for a set: the two write the same rows and invalidate the same
// queries, and only the gate in front of them differs — Finish is offered once the block is done,
// Stop asks for the phrase first (StopMesocycleSheet).
//
// Both invalidate `mesocycles`, so the list moves the block out of Active, and the workout queries,
// so the Today tab re-reads — with no active mesocycle it goes back to inviting a new one.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { finishMesocycle, stopMesocycle } from '@usecases/mesocycleClosing';

import { useMesocycleClosingDeps } from './mesocycleStore';
import { invalidateWorkoutQueries } from './useWorkoutSession';

function invalidateClosedMesocycle(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['mesocycles'] }),
    invalidateWorkoutQueries(queryClient),
  ]);
}

/** Finishes the block — offered only once every session of it is final. */
export function useFinishMesocycle() {
  const queryClient = useQueryClient();
  const deps = useMesocycleClosingDeps();

  return useMutation({
    mutationFn: (mesoId: string) => finishMesocycle(mesoId, deps),
    onSuccess: () => invalidateClosedMesocycle(queryClient),
  });
}

/** Stops the block where it stands — runs only after the confirmation phrase was typed. */
export function useStopMesocycle() {
  const queryClient = useQueryClient();
  const deps = useMesocycleClosingDeps();

  return useMutation({
    mutationFn: (mesoId: string) => stopMesocycle(mesoId, deps),
    onSuccess: () => invalidateClosedMesocycle(queryClient),
  });
}
