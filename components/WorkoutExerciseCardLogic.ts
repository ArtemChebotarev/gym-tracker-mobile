// Pure helpers behind components/WorkoutExerciseCard.tsx — see the code-style skill.

import type { WorkoutMode } from '@domain/workoutView';
import type { WorkoutExercise } from '@usecases/workoutSession';

/**
 * What a card shows (08.7, "Карточка упражнения"). The four variants come from the screen mode
 * plus the exercise's own status:
 * - live — everything, including `⋯`;
 * - read-only — no `⋯`;
 * - skipped (either mode) — the card at 50% opacity, logged rows plus one `Skipped` row;
 * - preview — no RIR badge, no set rows, the `Not programmed yet` plate instead.
 * The history button is there in every variant.
 */
export type ExerciseCardView = {
  showMenu: boolean;
  /** `2 RIR`, or `undefined` when the badge isn't shown. */
  rirLabel: string | undefined;
  isSkipped: boolean;
  /** The column header and set rows — everything but preview. */
  showSets: boolean;
  showNotProgrammed: boolean;
};

export function exerciseCardView(
  mode: WorkoutMode,
  exercise: Pick<WorkoutExercise, 'status' | 'targetRir'>,
): ExerciseCardView {
  const isPreview = mode === 'preview';
  return {
    showMenu: mode === 'live',
    rirLabel:
      !isPreview && exercise.targetRir !== undefined ? formatRir(exercise.targetRir) : undefined,
    isSkipped: !isPreview && exercise.status === 'skipped',
    showSets: !isPreview,
    showNotProgrammed: isPreview,
  };
}

/** `2 RIR` — the chip, and the reps placeholder of a row with no `targetReps`. */
export function formatRir(rir: number): string {
  return `${rir} RIR`;
}

/**
 * The group chip sits above a card only when its muscle group differs from the previous card's
 * (08.7, "Список упражнений") — so the first card always gets one.
 */
export function showsGroupChip(
  exercises: readonly Pick<WorkoutExercise, 'muscleGroup'>[],
  index: number,
): boolean {
  const current = exercises[index];
  if (current === undefined) {
    return false;
  }
  return index === 0 || exercises[index - 1]?.muscleGroup !== current.muscleGroup;
}
