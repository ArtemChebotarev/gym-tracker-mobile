// Deletes a planned mesocycle through the usecase layer via TanStack Query — task 074, Planned
// `⋯` → `Delete mesocycle` (08.3 · Мезоциклы — список). The confirmation popup lives in the screen;
// this hook runs only after it was accepted. Invalidates `mesocycles` so the row disappears.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deletePlannedMesocycle } from '@usecases/mesocycleList';

import { useMesocycleListDeps } from './mesocycleStore';

export function useDeletePlannedMesocycle() {
  const queryClient = useQueryClient();
  const deps = useMesocycleListDeps();

  return useMutation({
    mutationFn: (id: string) => deletePlannedMesocycle(id, deps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesocycles'] });
    },
  });
}
