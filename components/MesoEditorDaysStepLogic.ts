// Pure, non-JSX logic behind MesoEditorDaysStep.tsx — see the code-style skill, "Screens keep
// the same split, one level up". `canContinueFromDays` is used by the route
// (app/meso-editor/new.tsx) to gate the shared footer's Continue button, not by this step's own
// content component.

import { FULL_BODY, type Exercise } from '@domain/catalog';
import { exerciseTypeOf } from '@domain/exerciseConfigBuilders';
import { DEFAULT_EXERCISE_SETS } from '@domain/planValidators';
import type { WeekPlanExercise } from '@domain/plan';
import { getExerciseTypeIcon } from '@design/exerciseTypeIcon';
import { getExerciseTypeLabel } from '@design/exerciseTypeLabel';
import type { IconComponent } from '@design/icons/IconFrame';
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

export function getDayExercises(
  exercisesByDay: ExercisesByDay,
  dayNumber: number,
): WeekPlanExercise[] {
  return exercisesByDay[dayNumber] ?? [];
}

/**
 * Appends `exerciseId` to `dayNumber` with `sets` — the mockup's default (08.5, "Шаг 2": "степпер
 * sets с дефолтом 2") unless the caller says otherwise, as for an interval's one round — and the
 * next `order`. Called once per selected exercise by
 * app/meso-editor/new.tsx when task 077's "Add exercise" sheet confirms a (possibly multi-)
 * selection.
 *
 * An exercise already in the day isn't added again (GT-155: one exercise once per day — the
 * reference resolver knows a day, not which of two copies) — the plan comes back as it was. The
 * picker shows such an exercise inactive, so this only catches a way round it.
 */
export function addExerciseToDay(
  exercisesByDay: ExercisesByDay,
  dayNumber: number,
  exerciseId: string,
  sets: number = DEFAULT_EXERCISE_SETS,
): ExercisesByDay {
  const existing = getDayExercises(exercisesByDay, dayNumber);
  if (existing.some((exercise) => exercise.exerciseId === exerciseId)) {
    return exercisesByDay;
  }
  const order = existing.reduce((highest, exercise) => Math.max(highest, exercise.order), -1) + 1;
  const next: WeekPlanExercise = { exerciseId, order, sets };
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

/**
 * Applies a drag-reorder to `dayNumber`: `newOrder` is a permutation of indices into the day's
 * *current* array (see `moveIndex`, dragReorderLogic.ts), and the result reindexes `order` to match the new array
 * position — same invariant `addExerciseToDay` and `removeExerciseFromDay` already keep, since
 * nothing elsewhere in the domain re-derives `order` from anything other than "position in this
 * array".
 */
export function reorderDayExercises(
  exercisesByDay: ExercisesByDay,
  dayNumber: number,
  newOrder: readonly number[],
): ExercisesByDay {
  const current = getDayExercises(exercisesByDay, dayNumber);
  const reordered = newOrder
    .map((originalIndex) => current[originalIndex])
    .filter((exercise): exercise is WeekPlanExercise => exercise !== undefined)
    .map((exercise, index) => ({ ...exercise, order: index }));
  return { ...exercisesByDay, [dayNumber]: reordered };
}

/**
 * The Reorder days sheet's `Done` (GT-270): day `position + 1` takes what was under day
 * `newOrder[position]`. Days have no names, only their number, so the numbers stay where they are
 * and the exercises move — `Day 1` is always the first day. `newOrder` is the sheet's own list of
 * day numbers, top to bottom, one per day 1..`daysPerWeek`; an entry left behind beyond
 * `daysPerWeek` (see `MesoBuilderDraft.exercisesByDay`) is not a day of this week and stays as it
 * was.
 */
export function reorderDays(
  exercisesByDay: ExercisesByDay,
  newOrder: readonly number[],
): ExercisesByDay {
  const reordered: ExercisesByDay = { ...exercisesByDay };
  newOrder.forEach((dayNumber, position) => {
    reordered[position + 1] = getDayExercises(exercisesByDay, dayNumber);
  });
  return reordered;
}

/** Gates Continue (08.5, "Шаг 2": "Continue неактивна, пока хотя бы один день пуст"). */
export function canContinueFromDays(daysPerWeek: number, exercisesByDay: ExercisesByDay): boolean {
  return getDayNumbers(daysPerWeek).every((day) => getDayExercises(exercisesByDay, day).length > 0);
}

export function exerciseDotColor(
  exercisesById: ExercisesById,
  exerciseId: string,
): string | undefined {
  const muscleGroup = exercisesById[exerciseId]?.muscleGroup;
  if (!muscleGroup) {
    return undefined;
  }
  const category = getMuscleGroupCategory(muscleGroup);
  return category ? getCategoryColor(category) : undefined;
}

/**
 * The line under the name: the muscle group, or — for an exercise without one (`fullBody`) — its
 * type, the way the library files it (10.1 FR-1): `Power`, `Intervals`, `Mobility`.
 */
export function exerciseSubtitle(exercisesById: ExercisesById, exerciseId: string): string {
  const exercise = exercisesById[exerciseId];
  if (!exercise) {
    return '';
  }
  return exercise.muscleGroup === FULL_BODY
    ? getExerciseTypeLabel(exerciseTypeOf(exercise))
    : getMuscleGroupLabel(exercise.muscleGroup);
}

/**
 * What stands in for the group dot of an exercise that has no group colour — a `fullBody` hybrid
 * one: the icon of its type (canvas 7.2). `undefined` wherever the dot has a colour to show.
 */
export function exerciseTypeIcon(
  exercisesById: ExercisesById,
  exerciseId: string,
): IconComponent | undefined {
  const exercise = exercisesById[exerciseId];
  if (
    !exercise ||
    exerciseTypeOf(exercise) === 'strength' ||
    exerciseDotColor(exercisesById, exerciseId)
  ) {
    return undefined;
  }
  return getExerciseTypeIcon(exerciseTypeOf(exercise));
}

/** 08.5, "Шаг 3": `N sets`. */
export function formatSetCount(sets: number): string {
  return `${sets} ${sets === 1 ? 'set' : 'sets'}`;
}

/** 08.5, "Шаг 3", for an interval: `N rounds`. */
export function formatRoundCount(rounds: number): string {
  return `${rounds} ${rounds === 1 ? 'round' : 'rounds'}`;
}

/**
 * Whether the row has a stepper: strength and power for their sets, an interval for its rounds
 * (GT-190). A mobility one is a single block with nothing to set (GT-191). The cycle editor sets
 * nothing else (Artem, 27.10.2026).
 */
export function hasSetsStepper(exercisesById: ExercisesById, exerciseId: string): boolean {
  const exercise = exercisesById[exerciseId];
  return exercise === undefined || exerciseTypeOf(exercise) !== 'mobility';
}

/** What the row's stepper counts: an interval's rounds, every other exercise's sets. */
export function stepperNoun(exercisesById: ExercisesById, exerciseId: string): 'rounds' | 'sets' {
  const exercise = exercisesById[exerciseId];
  return exercise !== undefined && exerciseTypeOf(exercise) === 'interval' ? 'rounds' : 'sets';
}

export function exerciseTitle(exercisesById: ExercisesById, exerciseId: string): string {
  return exercisesById[exerciseId]?.name ?? '';
}
