// WeekPlanExercise invariant validators — see 02 · Domain Model ("WeekPlan"). Kept separate
// from `domain/plan.ts` (types only) per the single-responsibility rule, same split as
// `domain/mesocycleValidators.ts` next to `domain/mesocycle.ts`.
//
// No bound on `sets` is written down anywhere in the spec (02 · Domain Model's WeekPlanExercise
// table lists it as a bare `number`) — these bounds are this task's own engineering call, not a
// transcribed product decision. 1..10 covers every realistic working-set count for a single
// exercise; flag to Artem for adjustment if that's wrong.

export const MIN_EXERCISE_SETS = 1;
export const MAX_EXERCISE_SETS = 10;

// 08.5 · Редактор мезоцикла — Flow A, "Шаг 2": "степпер sets с дефолтом 2".
export const DEFAULT_EXERCISE_SETS = 2;

export function validateWeekPlanExerciseSets(sets: number): void {
  if (sets < MIN_EXERCISE_SETS || sets > MAX_EXERCISE_SETS) {
    throw new Error(
      `WeekPlanExercise sets must be between ${MIN_EXERCISE_SETS} and ${MAX_EXERCISE_SETS}, got ${sets}.`,
    );
  }
}
