// Pure helpers behind components/BodyWeightSheet.tsx — see the code-style skill.

import { isBodyWeightExercise } from '@domain/bodyWeightLoad';
import type { WorkoutSessionModel } from '@usecases/workoutSession';

/** A body weight as the sheet writes it: a positive number, a decimal comma counting too. */
export function parseBodyWeight(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(normalized)) {
    return null;
  }
  const value = Number(normalized);
  return value > 0 ? value : null;
}

/**
 * Whether to ask for the block's body weight (task 105): a live session with a bodyweight exercise
 * in it, in a mesocycle that has no body weight yet. Asked once — saving it answers the question
 * for every later bodyweight exercise of the block.
 *
 * Read-only and preview sessions never ask: there's nothing to log, so nothing needs the value.
 */
export function asksForBodyWeight(model: WorkoutSessionModel | undefined): boolean {
  return (
    model !== undefined &&
    model.mode === 'live' &&
    model.bodyWeight === undefined &&
    model.exercises.some((exercise) => isBodyWeightExercise(exercise.equipment))
  );
}
