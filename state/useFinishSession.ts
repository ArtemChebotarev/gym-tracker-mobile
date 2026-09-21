// Finishes the open session through the usecase layer via TanStack Query — task 094 (08.7 ·
// Тренировка, "Кнопка Finish workout"; 05, "Завершение тренировки"). No confirmation: the session
// becomes final and next week's session of the same day is generated in one transaction (050). On
// success the workout and grid queries are invalidated, so the screen re-reads the session — now
// read-only, with the completed check — and the grid shows the new day.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { finishSession } from '@usecases/sessionFinish';

import { invalidateWorkoutQueries } from './useWorkoutSession';
import { sessionFinishDeps } from './workoutStore';

export function useFinishSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => finishSession(sessionId, sessionFinishDeps()),
    onSuccess: () => invalidateWorkoutQueries(queryClient),
  });
}
