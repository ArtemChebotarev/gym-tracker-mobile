// Reads the mesocycle overview grid (08.7 · Тренировка, "Лист «Обзор мезоцикла»", task 089)
// through the usecase layer via TanStack Query. The grid changes whenever a session's status does —
// logging a first set, Finish, Skip workout — so those mutations invalidate `MESO_GRID_QUERY_KEY`.

import { useQuery } from '@tanstack/react-query';

import { getMesoGrid } from '@usecases/mesoGrid';

import { ensureMesocyclesSeeded, mesoGridDeps } from './mesocycleStore';

/** Prefix of every grid query — invalidate it after any change to a session's status. */
export const MESO_GRID_QUERY_KEY = ['mesoGrid'] as const;

export function useMesoGrid(mesoId: string) {
  return useQuery({
    queryKey: [...MESO_GRID_QUERY_KEY, mesoId],
    queryFn: async () => {
      await ensureMesocyclesSeeded();
      return getMesoGrid(mesoId, mesoGridDeps);
    },
  });
}
