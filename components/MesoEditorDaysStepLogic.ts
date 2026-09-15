// Pure, non-JSX logic behind MesoEditorDaysStep.tsx — see the code-style skill, "Screens keep
// the same split, one level up". `canContinueFromDays` is used by the route
// (app/meso-editor/new.tsx) to gate the shared footer's Continue button, not by this step's own
// content component.

import type { Animated } from 'react-native';

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
 * sets с дефолтом 2") and the next `order`. Called once per selected exercise by
 * app/meso-editor/new.tsx when task 077's "Add exercise" sheet confirms a (possibly multi-)
 * selection.
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

/**
 * Task 080's drag-to-reorder — pure math behind MesoEditorDaysStep.tsx's hand-rolled
 * PanResponder drag (see that file's own comment for why this is hand-rolled rather than a
 * library: two different drag libraries both had real, reproducible on-device bugs — one broke
 * styling, the other desynced its own position bookkeeping into "every drop swaps the last two
 * rows" — so this stays a few lines of plain arithmetic we can actually reason about and test,
 * built on nothing but React Native's own PanResponder and Animated.
 */

/**
 * Which slot a drag starting at `fromIndex` and moving `dragDistance` points (positive = down)
 * lands on, given `itemCount` same-height rows. Deliberately stateless — always computed from the
 * *total* distance since the gesture started, not incrementally — so it can't drift the way a
 * running "current position" tally could.
 */
export function dragTargetIndex(
  fromIndex: number,
  dragDistance: number,
  itemCount: number,
  rowHeight: number,
): number {
  const rawIndex = fromIndex + Math.round(dragDistance / rowHeight);
  return Math.max(0, Math.min(itemCount - 1, rawIndex));
}

/**
 * How many rows a *non-dragged* row at `rowIndex` should shift, in row-height units (-1, 0, or
 * +1), to visually make room for a drag currently previewing a move from `fromIndex` to
 * `hoverIndex` — the "other rows slide out of the way while you drag" effect. Dragging down
 * pushes the rows strictly between the origin and the hover slot up by one; dragging up pushes
 * the rows between the hover slot and the origin down by one. Rows outside that span, and the
 * dragged row itself (rowIndex === fromIndex), never shift.
 */
export function rowShiftUnits(rowIndex: number, fromIndex: number, hoverIndex: number): number {
  if (fromIndex === hoverIndex) {
    return 0;
  }
  if (fromIndex < hoverIndex) {
    return rowIndex > fromIndex && rowIndex <= hoverIndex ? -1 : 0;
  }
  return rowIndex >= hoverIndex && rowIndex < fromIndex ? 1 : 0;
}

/** The permutation of original indices produced by moving the item at `fromIndex` to `toIndex` —
 * feeds directly into `reorderDayExercises`'s `newOrder` parameter. */
export function moveIndex(itemCount: number, fromIndex: number, toIndex: number): number[] {
  const order = Array.from({ length: itemCount }, (_, index) => index);
  const moved = order.splice(fromIndex, 1)[0];
  if (moved === undefined) {
    return order;
  }
  order.splice(toIndex, 0, moved);
  return order;
}

/**
 * Applies a drag-reorder to `dayNumber`: `newOrder` is a permutation of indices into the day's
 * *current* array (see `moveIndex`), and the result reindexes `order` to match the new array
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
 * Ends a drag: cancels each row's in-flight push-preview spring (started by
 * MesoEditorDaysStep.tsx's effect on the row's *previous* hoverIndex) before snapping every
 * offset back to 0. `setValue()` alone isn't enough — it doesn't stop an animation already
 * running via `.start()`, so a spring still mid-flight from the last `onPanResponderMove` kept
 * emitting its own frames afterward and stomped a plain reset a moment later, producing a brief
 * "two rows swap, then settle back" flash on-device before this fix.
 */
export function resetRowShiftAnimations(rowShiftAnimations: readonly Animated.Value[]): void {
  rowShiftAnimations.forEach((animation) => {
    animation.stopAnimation();
    animation.setValue(0);
  });
}

/** Gates Continue (08.5, "Шаг 2": "Continue неактивна, пока хотя бы один день пуст"). */
export function canContinueFromDays(daysPerWeek: number, exercisesByDay: ExercisesByDay): boolean {
  return getDayNumbers(daysPerWeek).every((day) => getDayExercises(exercisesByDay, day).length > 0);
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
