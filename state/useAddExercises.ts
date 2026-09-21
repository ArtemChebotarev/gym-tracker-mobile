// Adds unplanned exercises to the open session through the usecase layer via TanStack Query —
// task 096 (08.7 · Тренировка, "Меню шапки" → Add exercise; 05, "Добавить внеплановое
// упражнение"). The picked exercises go to the end of the session with 2 set rows each and rule 6
// targets (048). On success the workout queries are invalidated, so the screen re-reads the
// session with the new cards.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { addExercises, type ExerciseAdditionInput } from '@usecases/exerciseAddition';

import { invalidateWorkoutQueries } from './useWorkoutSession';
import { exerciseAdditionDeps } from './workoutStore';

export function useAddExercises() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ExerciseAdditionInput) => addExercises(input, exerciseAdditionDeps()),
    onSuccess: () => invalidateWorkoutQueries(queryClient),
  });
}
