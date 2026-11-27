// Deletes a mesocycle through the usecase layer via TanStack Query — Planned `⋯` → `Delete` (task
// 074) and, since GT-268, a finished block's `Delete` on 08.3 and 08.9. The confirmation popup lives
// in the screen; this hook runs only after it was accepted.
//
// A planned block takes nothing with it, so the list was all there was to refresh. A finished one
// takes its sessions and logged sets, which every history-derived read was showing: exercise
// history and overview, the library's last-set caption, the workout and grid queries, Flow C's
// source weeks. All of them are invalidated, so no screen keeps a cached set that no longer exists.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteMesocycle } from '@usecases/mesocycleList';

import { useMesocycleListDeps } from './mesocycleStore';
import { MESO_GRID_QUERY_KEY } from './useMesoGrid';
import { SOURCE_WEEK_PLAN_QUERY_KEY, SOURCE_WEEKS_QUERY_KEY } from './useSourceWeeks';
import { WORKOUT_SESSION_QUERY_KEY } from './useWorkoutSession';

const HISTORY_QUERY_KEYS = [
  ['mesocycles'],
  ['exerciseHistory'],
  ['exerciseOverview'],
  ['exerciseLibrary'],
  WORKOUT_SESSION_QUERY_KEY,
  MESO_GRID_QUERY_KEY,
  SOURCE_WEEKS_QUERY_KEY,
  SOURCE_WEEK_PLAN_QUERY_KEY,
] as const;

export function useDeleteMesocycle() {
  const queryClient = useQueryClient();
  const deps = useMesocycleListDeps();

  return useMutation({
    meta: { operation: 'deleteMesocycle' },
    mutationFn: (id: string) => deleteMesocycle(id, deps),
    onSuccess: () =>
      Promise.all(
        HISTORY_QUERY_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });
}
