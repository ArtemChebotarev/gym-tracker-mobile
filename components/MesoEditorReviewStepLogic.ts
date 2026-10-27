// Pure, non-JSX logic behind MesoEditorReviewStep.tsx — see the code-style skill, "Screens keep
// the same split, one level up". Row/dot/day helpers are reused from MesoEditorDaysStepLogic.ts
// and the week/day formatters from MesoEditorBasicsStepLogic.ts rather than copied here.

import type { ExerciseSettingsById } from '@domain/exerciseSettingsBuilders';
import type { WeekPlanExercise } from '@domain/plan';

import { formatDaysPerWeekValue, formatMesocycleLengthValue } from './MesoEditorBasicsStepLogic';
import {
  exercisePlan,
  formatSetCount,
  hasSetsStepper,
  type ExercisesById,
} from './MesoEditorDaysStepLogic';

/**
 * 08.5, "Шаг 3": what each preview row shows on the right — `N sets` for a strength or power
 * exercise, an interval's plan chip on one line (canvas 7.1, "Review"): `3 rounds · Less rest`. A
 * mobility one shows nothing: it is one block, and its length comes from history (GT-191).
 */
export function formatReviewPlan(
  exercisesById: ExercisesById,
  entry: WeekPlanExercise,
  exerciseSettings: ExerciseSettingsById = {},
): string {
  const plan = exercisePlan(exercisesById, entry, exerciseSettings);
  if (plan) {
    return `${plan.value} · ${plan.caption}`;
  }
  return hasSetsStepper(exercisesById, entry.exerciseId) ? formatSetCount(entry.sets) : '';
}

/** The summary card's meta line under the name (08.5, "Шаг 3": "длина, дни/неделя"). */
export function formatReviewSummary(lengthWeeks: number, daysPerWeek: number): string {
  return `${formatMesocycleLengthValue(lengthWeeks)} · ${formatDaysPerWeekValue(daysPerWeek)} per week`;
}
