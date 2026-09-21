// Saves the block's body weight through the usecase layer via TanStack Query — task 105. Written
// both by the sheet that asks for it the first time and by editing the Weight field of a pure
// bodyweight exercise. On success the workout queries are invalidated, so every bodyweight row
// still to be logged picks the new value up.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { setBodyWeight, type BodyWeightInput } from '@usecases/bodyWeight';

import { invalidateWorkoutQueries } from './useWorkoutSession';
import { useBodyWeightDeps } from './workoutStore';

export function useSetBodyWeight() {
  const queryClient = useQueryClient();
  const deps = useBodyWeightDeps();

  return useMutation({
    mutationFn: (input: BodyWeightInput) => setBodyWeight(input, deps),
    onSuccess: () => invalidateWorkoutQueries(queryClient),
  });
}
