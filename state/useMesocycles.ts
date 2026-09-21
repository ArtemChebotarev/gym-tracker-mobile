// Reads every mesocycle for the Mesocycles tab (08.3 · Мезоциклы — список, task 074) through the
// usecase layer via TanStack Query. The `mesocycles` key is the one Confirm (useConfirmMesocycleDraft)
// and Delete (useDeletePlannedMesocycle) invalidate, so the list refreshes after either.

import { useQuery } from '@tanstack/react-query';

import { listMesocycles } from '@usecases/mesocycleList';

import { useMesocycleListDeps } from './mesocycleStore';

export function useMesocycles() {
  const deps = useMesocycleListDeps();

  return useQuery({
    queryKey: ['mesocycles'],
    queryFn: () => listMesocycles(deps),
  });
}
