// Pure, non-JSX logic behind MesoEditorReviewStep.tsx — see the code-style skill, "Screens keep
// the same split, one level up". Row/dot/day helpers are reused from MesoEditorDaysStepLogic.ts
// and the week/day formatters from MesoEditorBasicsStepLogic.ts rather than copied here.

import { exerciseTypeOf } from '@domain/exerciseConfigBuilders';
import type { WeekPlanExercise } from '@domain/plan';

import { formatDaysPerWeekValue, formatMesocycleLengthValue } from './MesoEditorBasicsStepLogic';
import { exercisePlan, formatSetCount, type ExercisesById } from './MesoEditorDaysStepLogic';

/**
 * 08.5, "Шаг 3": what each preview row shows on the right — `N sets` for a strength exercise, the
 * plan chip on one line for the others (canvas 7.1, "Review"): `3 sets · 1:00 rest`,
 * `3 × 2:00 · 1:00 rest`, and a mobility one's bare length, `10:00`.
 */
export function formatReviewPlan(exercisesById: ExercisesById, entry: WeekPlanExercise): string {
  const exercise = exercisesById[entry.exerciseId];
  const plan = exercisePlan(exercisesById, entry);
  if (!exercise || !plan) {
    return formatSetCount(entry.sets);
  }
  return exerciseTypeOf(exercise) === 'mobility' ? plan.value : `${plan.value} · ${plan.caption}`;
}

/** The summary card's meta line under the name (08.5, "Шаг 3": "длина, дни/неделя"). */
export function formatReviewSummary(lengthWeeks: number, daysPerWeek: number): string {
  return `${formatMesocycleLengthValue(lengthWeeks)} · ${formatDaysPerWeekValue(daysPerWeek)} per week`;
}
