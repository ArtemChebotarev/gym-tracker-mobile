// Logs and un-logs a set row through the usecase layer via TanStack Query — task 093 (08.7 ·
// Тренировка, "Строка подхода"; 05, "Записать подход", "Снять отметку"). Each call is written to
// storage right away (045); on success the workout queries are invalidated so the screen re-reads
// the session. A conflict with another `in_progress` session is a successful result, not an error
// — the screen shows its alert from the result.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SetEntry } from '@domain/executionValidators';
import { logSet, type SetRowRef, unlogSet } from '@usecases/setLogging';

import { WORKOUT_SESSION_QUERY_KEY } from './useWorkoutSession';
import { workoutStore } from './workoutStore';

export function useLogSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ref, entry }: { ref: SetRowRef; entry: SetEntry }) =>
      logSet(ref, entry, workoutStore),
    onSuccess: (result) => {
      if (result.kind === 'logged') {
        return queryClient.invalidateQueries({ queryKey: WORKOUT_SESSION_QUERY_KEY });
      }
      return undefined;
    },
  });
}

export function useUnlogSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ref: SetRowRef) => unlogSet(ref, workoutStore),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKOUT_SESSION_QUERY_KEY }),
  });
}
