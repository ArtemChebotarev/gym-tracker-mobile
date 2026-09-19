// The exercise menu's one-tap actions through the usecase layer via TanStack Query — task 097
// (08.7 · Тренировка, "Лист «Меню упражнения»"; 05, "Действия во время тренировки"): add or remove
// a set row (046), move the exercise up or down (048), skip or unskip it (049), delete it (086).
// One mutation for all of them — they differ only in the use case called, and the screen treats
// them alike: re-read the session on success, one error alert on failure. Each is written to
// storage right away. Replace, which needs a picked exercise, is `useSwapExercise`.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { removeExercise } from '@usecases/exerciseRemoval';
import { moveExercise } from '@usecases/exerciseReorder';
import { skipExercise, unskipExercise } from '@usecases/exerciseSkipping';
import { swapExercise, type ExerciseSwapInput } from '@usecases/exerciseSwap';
import type { SessionExerciseRef } from '@usecases/openSession';
import { addSet, removeLastSet } from '@usecases/setRows';

import { invalidateWorkoutQueries } from './useWorkoutSession';
import { exerciseSwapDeps, workoutStore } from './workoutStore';

export type ExerciseCommand =
  'addSet' | 'removeLastSet' | 'moveUp' | 'moveDown' | 'skip' | 'unskip' | 'delete';

function runExerciseCommand(command: ExerciseCommand, ref: SessionExerciseRef): Promise<unknown> {
  switch (command) {
    case 'addSet':
      return addSet(ref, workoutStore);
    case 'removeLastSet':
      return removeLastSet(ref, workoutStore);
    case 'moveUp':
      return moveExercise(ref, 'up', workoutStore);
    case 'moveDown':
      return moveExercise(ref, 'down', workoutStore);
    case 'skip':
      return skipExercise(ref, workoutStore);
    case 'unskip':
      return unskipExercise(ref, workoutStore);
    case 'delete':
      return removeExercise(ref, workoutStore);
  }
}

export function useExerciseCommand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ command, ref }: { command: ExerciseCommand; ref: SessionExerciseRef }) =>
      runExerciseCommand(command, ref),
    onSuccess: () => invalidateWorkoutQueries(queryClient),
  });
}

/**
 * Replace exercise (047): swaps the session exercise to the picked one — its logged sets, if any,
 * are deleted (the screen confirms first) and every row gets rule 6 targets.
 */
export function useSwapExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ExerciseSwapInput) => swapExercise(input, exerciseSwapDeps),
    onSuccess: () => invalidateWorkoutQueries(queryClient),
  });
}
