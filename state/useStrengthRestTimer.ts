// Reads and changes the strength rest timer setting (10.1 FR-5, GT-87) through the usecase layer
// via TanStack Query. A change re-reads the workout too: its strength cards carry the rest the
// timer runs after a set (`WorkoutExercise.restSec`).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { StrengthRestTimer } from '@domain/restTimer';
import { readStrengthRestTimer, setStrengthRestTimer } from '@usecases/restTimerSettings';

import { useRepositories } from './repositories';
import { invalidateWorkoutQueries } from './useWorkoutSession';

const STRENGTH_REST_TIMER_QUERY_KEY = ['strengthRestTimer'];

export function useStrengthRestTimer() {
  const { settingsRepo } = useRepositories();

  return useQuery({
    queryKey: STRENGTH_REST_TIMER_QUERY_KEY,
    queryFn: () => readStrengthRestTimer({ settingsRepo }),
  });
}

export function useSetStrengthRestTimer() {
  const queryClient = useQueryClient();
  const { settingsRepo } = useRepositories();

  return useMutation({
    meta: { operation: 'setStrengthRestTimer' },
    mutationFn: (setting: StrengthRestTimer) => setStrengthRestTimer(setting, { settingsRepo }),
    onMutate: (setting) => queryClient.setQueryData(STRENGTH_REST_TIMER_QUERY_KEY, setting),
    onSuccess: (setting) => {
      queryClient.setQueryData(STRENGTH_REST_TIMER_QUERY_KEY, setting);
      return invalidateWorkoutQueries(queryClient);
    },
    onError: () => queryClient.invalidateQueries({ queryKey: STRENGTH_REST_TIMER_QUERY_KEY }),
  });
}
