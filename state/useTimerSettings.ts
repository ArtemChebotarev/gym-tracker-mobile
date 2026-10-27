// Reads and changes the timer settings — the rest between sets (10.1 FR-5, GT-87) and Get ready
// (FR-6, GT-188) — through the usecase layer via TanStack Query. A change re-reads the workout too:
// its cards carry the rest the timer runs after a set (`WorkoutExercise.restSec`) and an
// interval's Get ready (`IntervalWorkoutExercise.getReadySec`).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { RestBetweenSets } from '@domain/restTimer';
import {
  readTimerSettings,
  setGetReadySec,
  setRestBetweenSets,
  type TimerSettings,
  type TimerSettingsDeps,
} from '@usecases/timerSettings';

import { useRepositories } from './repositories';
import { invalidateWorkoutQueries } from './useWorkoutSession';

const TIMER_SETTINGS_QUERY_KEY = ['timerSettings'];

export function useTimerSettings() {
  const { settingsRepo } = useRepositories();

  return useQuery({
    queryKey: TIMER_SETTINGS_QUERY_KEY,
    queryFn: () => readTimerSettings({ settingsRepo }),
  });
}

/** A mutation of one of the timer settings, shown at once and put back if the write fails. */
function useTimerSettingMutation<T>(
  operation: string,
  write: (value: T, deps: TimerSettingsDeps) => Promise<TimerSettings>,
  apply: (settings: TimerSettings, value: T) => TimerSettings,
) {
  const queryClient = useQueryClient();
  const { settingsRepo } = useRepositories();

  return useMutation({
    meta: { operation },
    mutationFn: (value: T) => write(value, { settingsRepo }),
    onMutate: (value) =>
      queryClient.setQueryData<TimerSettings>(TIMER_SETTINGS_QUERY_KEY, (settings) =>
        settings === undefined ? settings : apply(settings, value),
      ),
    onSuccess: (settings) => {
      queryClient.setQueryData(TIMER_SETTINGS_QUERY_KEY, settings);
      return invalidateWorkoutQueries(queryClient);
    },
    onError: () => queryClient.invalidateQueries({ queryKey: TIMER_SETTINGS_QUERY_KEY }),
  });
}

export function useSetRestBetweenSets() {
  return useTimerSettingMutation<RestBetweenSets>(
    'setRestBetweenSets',
    setRestBetweenSets,
    (settings, restBetweenSets) => ({ ...settings, restBetweenSets }),
  );
}

export function useSetGetReadySec() {
  return useTimerSettingMutation<number>(
    'setGetReadySec',
    setGetReadySec,
    (settings, getReadySec) => ({
      ...settings,
      getReadySec,
    }),
  );
}
