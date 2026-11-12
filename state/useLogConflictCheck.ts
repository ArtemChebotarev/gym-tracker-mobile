// Asks, before the interval timer starts, whether its rounds could be logged at all — GT-259. A
// timer started on a day while another workout is in progress could neither save its rounds nor be
// ended; Start timer now meets the same rule a Log does (`findLogConflict`), up front. A read, so a
// mutation only for the imperative call: nothing is cached and nothing is invalidated.

import { useMutation } from '@tanstack/react-query';

import { findLogConflict } from '@usecases/sessionStart';

import { useWorkoutStore } from './workoutStore';

export function useLogConflictCheck() {
  const store = useWorkoutStore();

  return useMutation({
    meta: { operation: 'findLogConflict' },
    mutationFn: (sessionId: string) => findLogConflict(sessionId, store.repos),
  });
}
