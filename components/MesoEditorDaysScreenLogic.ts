// Pure, non-JSX logic behind MesoEditorDaysScreen.tsx — see the code-style skill, "Screens keep
// the same split, one level up".

import type { Exercise } from '@domain/catalog';
import { DEFAULT_EXERCISE_SETS } from '@domain/planValidators';
import type { WeekPlanExercise } from '@domain/plan';
import { getCategoryColor, getMuscleGroupCategory } from '@design/muscleGroupColor';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';

/** Mirrors `MesoBuilderDraft['exercisesByDay']` (`state/draftStore.ts`) without importing state/
 * into components/ — see that field's own comment for why a day with no entry reads as empty. */
export type ExercisesByDay = Record<number, WeekPlanExercise[]>;

export type ExercisesById = Record<string, Exercise>;

/** `[1, 2, ..., daysPerWeek]` — the day chips shown across the top of the screen. */
export function getDayNumbers(daysPerWeek: number): number[] {
  return Array.from({ length: daysPerWeek }, (_, index) => index + 1);
}

export function getDayExercises(exercisesByDay: ExercisesByDay, dayNumber: number): WeekPlanExercise[] {
  return exercisesByDay[dayNumber] ?? [];
}

/**
 * Appends `exerciseId` to `dayNumber` with the mockup's default sets (08.5, "Шаг 2": "степпер
 * sets с дефолтом 2") and the next `order`. Task 077's "Add exercise" sheet is this function's
 * intended caller once it exists; this task wires the row that will open that sheet, not the
 * sheet itself.
 */
export function addExerciseToDay(
  exercisesByDay: ExercisesByDay,
  dayNumber: number,
  exerciseId: string,
): ExercisesByDay {
  const existing = getDayExercises(exercisesByDay, dayNumber);
  const next: WeekPlanExercise = { exerciseId, order: existing.length, sets: DEFAULT_EXERCISE_SETS };
  return { ...exercisesByDay, [dayNumber]: [...existing, next] };
}

/** Removes the exercise at `index` and reindexes the remaining ones' `order` to stay contiguous. */
export function removeExerciseFromDay(
  exercisesByDay: ExercisesByDay,
  dayNumber: number,
  index: number,
): ExercisesByDay {
  const remaining = getDayExercises(exercisesByDay, dayNumber)
    .filter((_, entryIndex) => entryIndex !== index)
    .map((exercise, entryIndex) => ({ ...exercise, order: entryIndex }));
  return { ...exercisesByDay, [dayNumber]: remaining };
}

export function updateExerciseSets(
  exercisesByDay: ExercisesByDay,
  dayNumber: number,
  index: number,
  sets: number,
): ExercisesByDay {
  const updated = getDayExercises(exercisesByDay, dayNumber).map((exercise, entryIndex) =>
    entryIndex === index ? { ...exercise, sets } : exercise,
  );
  return { ...exercisesByDay, [dayNumber]: updated };
}

/** Gates Continue (08.5, "Шаг 2": "Continue неактивна, пока хотя бы один день пуст"). */
export function canContinueFromDays(daysPerWeek: number, exercisesByDay: ExercisesByDay): boolean {
  return getDayNumbers(daysPerWeek).every((day) => getDayExercises(exercisesByDay, day).length > 0);
}

/** Mockup (02-new-meso-days.html): the day header shows "4 exercises", not a bare count. */
export function formatDayExerciseCount(count: number): string {
  return `${count} ${count === 1 ? 'exercise' : 'exercises'}`;
}

export function exerciseDotColor(exercisesById: ExercisesById, exerciseId: string): string | undefined {
  const muscleGroup = exercisesById[exerciseId]?.muscleGroup;
  if (!muscleGroup) {
    return undefined;
  }
  const category = getMuscleGroupCategory(muscleGroup);
  return category ? getCategoryColor(category) : undefined;
}

export function exerciseSubtitle(exercisesById: ExercisesById, exerciseId: string): string {
  const muscleGroup = exercisesById[exerciseId]?.muscleGroup;
  return muscleGroup ? getMuscleGroupLabel(muscleGroup) : '';
}

export function exerciseTitle(exercisesById: ExercisesById, exerciseId: string): string {
  return exercisesById[exerciseId]?.name ?? '';
}
