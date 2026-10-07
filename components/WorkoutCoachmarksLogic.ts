// The first-workout coachmark tour — 08.11 · Onboarding, "3. Коучмарки на первой тренировке" (GT-42):
// four steps (the ⓘ beside Weight, the ⓘ beside Reps, the RIR badge, the grid button), shown once.
// Working text, reworded after the TestFlight feedback; it lives here so that touches this file.
//
// What a step is — the words, and the ref of the element it rings — is built here, from the first
// card and the header; drawing the tour and measuring the refs is `CoachmarkTour`.

import type { PlateTextPart } from '@design/components/PlateText';
import { InfoIcon } from '@design/icons/InfoIcon';
import type { WorkoutMode } from '@domain/workoutView';
import type { WorkoutExercise } from '@usecases/workoutSession';

import { cardInfoTargets } from './WorkoutExerciseCardLogic';
import { rirExplanation, type RirExplanation } from './RirExplanationLogic';

// The ⓘ in the text is the real icon, not the character: the character is a thin outline that
// cannot be made heavier and is hard to find in a line of text (Artem, 06.10.2026). The key words
// are strong.
export const WEIGHT_STEP = {
  title: 'Not sure what weight to use?',
  paragraphs: [
    ['Tap ', { icon: InfoIcon }, ' for a quick way to find ', { strong: 'your first weight' }, '.'],
  ] as PlateTextPart[][],
};

export const REPS_STEP = {
  title: 'Want to change the weight?',
  paragraphs: [
    ['Tap ', { icon: InfoIcon }, ' to see ', { strong: 'how many reps to aim for' }, ' at another weight.'],
  ] as PlateTextPart[][],
};

export const GRID_STEP = {
  title: 'Cycle overview',
  paragraphs: [
    ['See ', { strong: 'which days are done' }, ' and jump to any workout.'],
  ] as PlateTextPart[][],
};

/** What a step points at: either ⓘ disc, the first card's RIR chip, or the header's grid button. */
export type CoachmarkTargetId = 'rir' | 'weight' | 'reps' | 'grid';

/** A step without its element: which one it rings, and what it says. The screen holds the refs. */
export type WorkoutCoachmark = {
  target: CoachmarkTargetId;
  title: string;
  paragraphs?: readonly (string | readonly PlateTextPart[])[];
  /** The RIR step explains with a picture and rows rather than paragraphs. */
  explanation?: RirExplanation;
};

export type WorkoutCoachmarkInput = {
  /** The first card of the workout — the one the card-level steps point at. */
  exercise: WorkoutExercise | undefined;
  mode: WorkoutMode;
  isDeload: boolean;
};

/**
 * The steps this workout's tour has. A step is there only if the thing it points at is: a card
 * without a Reps ⓘ (bodyweight, a deload) just has no step for it, and the counter says `N of M`
 * with the M that is left. The same `cardInfoTargets` the card draws its buttons by decides it.
 *
 * Refs stay out of this on purpose — it only says which element each step is about, and the screen,
 * which owns the refs, puts them in. That keeps it a plain function of the data, and keeps refs out
 * of function calls made during render.
 */
export function workoutCoachmarks({
  exercise,
  mode,
  isDeload,
}: WorkoutCoachmarkInput): WorkoutCoachmark[] {
  const steps: WorkoutCoachmark[] = [];

  if (exercise !== undefined) {
    const targets = cardInfoTargets(exercise, mode, isDeload);
    if (targets.weight) {
      steps.push({ target: 'weight', ...WEIGHT_STEP });
    }
    if (targets.reps) {
      steps.push({ target: 'reps', ...REPS_STEP });
    }
    if (targets.rir && exercise.targetRir !== undefined) {
      const explanation = rirExplanation({ targetRir: exercise.targetRir, isDeload });
      steps.push({ target: 'rir', title: explanation.title, explanation });
    }
  }
  steps.push({ target: 'grid', ...GRID_STEP });

  return steps;
}
