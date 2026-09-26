// Reads "Мезоцикл (деталь)" (08.9, task 129) through the usecase layer via TanStack Query.
//
// The key sits under `mesocycles`, so every change that already refreshes the Mesocycles list —
// Rename, Finish, Stop — refreshes an open detail screen too. The summary also moves with logging a
// set, but that happens on the workout screen, and the detail is refetched on the way back to it.

import { useQuery } from '@tanstack/react-query';

import { loadMesocycleDetail } from '@usecases/mesocycleDetail';

import { useMesocycleDetailDeps } from './mesocycleStore';

export function useMesocycleDetail(mesoId: string) {
  const deps = useMesocycleDetailDeps();

  return useQuery({
    queryKey: ['mesocycles', 'detail', mesoId],
    queryFn: () => loadMesocycleDetail(mesoId, deps),
  });
}
