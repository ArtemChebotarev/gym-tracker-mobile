// Logs and un-logs an interval round by hand through the usecase layer via TanStack Query — GT-89
// (10.1 FR-7, "запасной путь"). The same shape as `useSetLogging.ts`: written to storage right away,
// the workout queries re-read on success, and a conflict with another `in_progress` session is a
// result the screen shows, not an error.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { RoundEntry } from '@domain/executionValidators';
import { logRound, type RoundRowRef, unlogRound } from '@usecases/roundLogging';

import { invalidateWorkoutQueries } from './useWorkoutSession';
import { useWorkoutStore } from './workoutStore';

export function useLogRound() {
  const queryClient = useQueryClient();
  const store = useWorkoutStore();

  return useMutation({
    meta: { operation: 'logRound' },
    mutationFn: ({ ref, entry }: { ref: RoundRowRef; entry: RoundEntry }) =>
      logRound(ref, entry, store),
    onSuccess: (result) => {
      if (result.kind === 'logged') {
        return invalidateWorkoutQueries(queryClient);
      }
      return undefined;
    },
  });
}

export function useUnlogRound() {
  const queryClient = useQueryClient();
  const store = useWorkoutStore();

  return useMutation({
    meta: { operation: 'unlogRound' },
    mutationFn: (ref: RoundRowRef) => unlogRound(ref, store),
    onSuccess: () => invalidateWorkoutQueries(queryClient),
  });
}
