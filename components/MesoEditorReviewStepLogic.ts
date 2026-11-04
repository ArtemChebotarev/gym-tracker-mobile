// Pure, non-JSX logic behind MesoEditorReviewStep.tsx — see the code-style skill, "Screens keep
// the same split, one level up". Row/dot/day helpers are reused from MesoEditorDaysStepLogic.ts
// and the week/day formatters from MesoEditorBasicsStepLogic.ts rather than copied here.

import type { PlateTextPart } from '@design/components/PlateText';
import type { WeekPlanExercise } from '@domain/plan';
import type { OnboardingFlags } from '@repositories/settings';

import { formatDaysPerWeekValue, formatMesocycleLengthValue } from './MesoEditorBasicsStepLogic';
import {
  formatRoundCount,
  formatSetCount,
  hasSetsStepper,
  stepperNoun,
  type ExercisesById,
} from './MesoEditorDaysStepLogic';

/**
 * 08.5, "Шаг 3": what each preview row shows on the right — `N sets`, an interval's `N rounds`,
 * and nothing for a mobility exercise, which is one block with nothing to set (GT-190, GT-191).
 */
export function formatReviewCount(exercisesById: ExercisesById, entry: WeekPlanExercise): string {
  if (!hasSetsStepper(exercisesById, entry.exerciseId)) {
    return '';
  }
  return stepperNoun(exercisesById, entry.exerciseId) === 'rounds'
    ? formatRoundCount(entry.sets)
    : formatSetCount(entry.sets);
}

/** The summary card's meta line under the name (08.5, "Шаг 3": "длина, дни/неделя"). */
export function formatReviewSummary(lengthWeeks: number, daysPerWeek: number): string {
  return `${formatMesocycleLengthValue(lengthWeeks)} · ${formatDaysPerWeekValue(daysPerWeek)} per week`;
}

/** The label over the progression block (GT-225; 08.5, 08.11 section 7). */
export const REVIEW_PROGRESSION_LABEL = 'How your cycle progresses';

/**
 * The block's three points: what the person does and what the app does with it, the same for every
 * exercise type — static text, no engine behind it (GT-225).
 */
export const REVIEW_PROGRESSION_FACTS: readonly (readonly PlateTextPart[])[] = [
  [{ strong: 'Log' }, ' what you do: it sets your targets.'],
  [{ strong: 'Each week' }, ' is a bit harder than the last.'],
  ['The ', { strong: 'last week' }, ' is lighter, so you recover.'],
];

/** The accessibility label of the block's cross, which puts it away for good (GT-225). */
export const REVIEW_PROGRESSION_HIDE_LABEL = 'Hide how your cycle progresses';

/**
 * Whether the Review step shows the progression block: on every Review, in every flow, until its
 * cross is tapped — no confirmation, a closed block stays closed (Artem, 04.11.2026 — replaced "before the first cycle only"). Not
 * while the flags are still being read, so it never flashes for someone who hid it.
 */
export function showsProgressionBlock(flags: OnboardingFlags | undefined): boolean {
  return flags !== undefined && !flags.reviewProgressionHidden;
}
