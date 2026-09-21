// Starts a planned mesocycle through the usecase layer via TanStack Query — task 042, Planned →
// Start (08.3 · Мезоциклы — список). The confirmation popup lives in the screen; this hook runs only
// after it was accepted. Invalidates `mesocycles` so the list shows the new Active card, and the
// workout queries so the Today tab picks up week 1.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { startMesocycle } from '@usecases/mesocycleStart';

import { mesocycleStartDeps } from './mesocycleStore';
import { invalidateWorkoutQueries } from './useWorkoutSession';

export function useStartMesocycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => startMesocycle(id, mesocycleStartDeps()),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mesocycles'] }),
        invalidateWorkoutQueries(queryClient),
      ]),
  });
}
