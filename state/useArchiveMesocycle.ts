// Archives a finished mesocycle through the usecase layer via TanStack Query — Completed `⋯` →
// `Archive` (08.3 · Мезоциклы — список). The confirmation popup lives in the screen; this hook
// runs only after it was accepted.
//
// Invalidating `mesocycles` is enough for both places the block was offered — the list's Completed
// group and Flow C's source dropdown read the same query and filter it through
// `finishedMesocyclesNewestFirst`, which now skips archived blocks.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { archiveMesocycle } from '@usecases/mesocycleList';

import { useMesocycleListDeps } from './mesocycleStore';

export function useArchiveMesocycle() {
  const queryClient = useQueryClient();
  const deps = useMesocycleListDeps();

  return useMutation({
    mutationFn: (id: string) => archiveMesocycle(id, deps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesocycles'] });
    },
  });
}
