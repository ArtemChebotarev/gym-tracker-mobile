// Pure, non-JSX logic behind MesoEditorReviewStep.tsx — see the code-style skill, "Screens keep
// the same split, one level up". Row/dot/day helpers are reused from MesoEditorDaysStepLogic.ts
// and the week/day formatters from MesoEditorBasicsStepLogic.ts rather than copied here.

import type { PlateTextPart } from '@design/components/PlateText';
import type { WeekPlanExercise } from '@domain/plan';

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

/**
 * Whether the Review step shows the progression block: only before the first cycle is saved —
 * after that it is noise that pushes the days down (GT-225). With no cycle at all, whatever its
 * status; never while the list is still being read. Flow C only exists after a finished cycle, so
 * it never shows there.
 */
export function showsProgressionBlock(mesocycles: readonly unknown[] | undefined): boolean {
  return mesocycles !== undefined && mesocycles.length === 0;
}
