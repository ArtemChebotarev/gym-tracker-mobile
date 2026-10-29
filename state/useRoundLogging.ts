// Logs and un-logs an interval round by hand through the usecase layer via TanStack Query — GT-89
// (10.1 FR-7, "запасной путь"). The same shape as `useSetLogging.ts`: written to storage right away,
// the workout queries re-read on success, and a conflict with another `in_progress` session is a
// result the screen shows, not an error. A time picked on the card is saved the same way, as the
// rounds' plan (`useSetRoundTime`, GT-187).

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { RoundEntry } from '@domain/executionValidators';
import type { RoundTimeColumn } from '@domain/roundTimes';
import type { SessionExerciseRef } from '@usecases/openSession';
import { logRound, type RoundRowRef, unlogRound } from '@usecases/roundLogging';
import { setRoundTime } from '@usecases/roundTimes';

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

export type SetRoundTimeInput = {
  ref: SessionExerciseRef;
  column: RoundTimeColumn;
  roundNumbers: readonly number[];
  sec: number;
};

export function useSetRoundTime() {
  const queryClient = useQueryClient();
  const store = useWorkoutStore();

  return useMutation({
    meta: { operation: 'setRoundTime' },
    mutationFn: ({ ref, column, roundNumbers, sec }: SetRoundTimeInput) =>
      setRoundTime(ref, column, roundNumbers, sec, store),
    onSuccess: () => invalidateWorkoutQueries(queryClient),
  });
}
