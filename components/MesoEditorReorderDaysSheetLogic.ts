// Pure, non-JSX logic behind MesoEditorReorderDaysSheet.tsx — see the code-style skill, "Screens
// keep the same split, one level up". The move itself is `reorderDays` (MesoEditorDaysStepLogic.ts),
// beside the other edits of the draft's days.

import type { WeekPlanExercise } from '@domain/plan';

import { exerciseTitle, type ExercisesById } from './MesoEditorDaysStepLogic';

/** The sheet's title, and the Days step's button that opens it (GT-270). */
export const REORDER_DAYS_TITLE = 'Reorder days';

/**
 * The line under a day in the sheet: its exercises' names in order, which is how a day is told
 * apart when days have no names of their own. A day with nothing in it yet says so.
 */
export function reorderDaySummary(
  exercises: readonly WeekPlanExercise[],
  exercisesById: ExercisesById,
): string {
  if (exercises.length === 0) {
    return 'No exercises yet';
  }
  return exercises.map((exercise) => exerciseTitle(exercisesById, exercise.exerciseId)).join(', ');
}

/** The sheet's list after a drag: `newOrder` indexes into `order`, as `moveIndex` gives it. */
export function applyDayDrag(order: readonly number[], newOrder: readonly number[]): number[] {
  return newOrder
    .map((index) => order[index])
    .filter((dayNumber): dayNumber is number => dayNumber !== undefined);
}
