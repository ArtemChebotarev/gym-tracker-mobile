// Skips the open session through the usecase layer via TanStack Query — task 096 (08.7 ·
// Тренировка, "Меню шапки" → Skip workout; 05, "Пропустить тренировку"). Every unfinished exercise
// is skipped, the session closes — `completed` if a set is logged, else `skipped` — and next week's
// session of the same day is generated, in one transaction (049). On success the workout and grid
// queries are invalidated, so the screen re-reads the session — now read-only — and the grid shows
// the new day.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { skipWorkout } from '@usecases/workoutSkip';

import { invalidateWorkoutQueries } from './useWorkoutSession';
import { workoutSkipDeps } from './workoutStore';

export function useSkipWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => skipWorkout(sessionId, workoutSkipDeps),
    onSuccess: () => invalidateWorkoutQueries(queryClient),
  });
}
