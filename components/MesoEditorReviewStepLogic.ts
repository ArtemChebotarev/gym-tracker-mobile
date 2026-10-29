// Pure, non-JSX logic behind MesoEditorReviewStep.tsx — see the code-style skill, "Screens keep
// the same split, one level up". Row/dot/day helpers are reused from MesoEditorDaysStepLogic.ts
// and the week/day formatters from MesoEditorBasicsStepLogic.ts rather than copied here.

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
