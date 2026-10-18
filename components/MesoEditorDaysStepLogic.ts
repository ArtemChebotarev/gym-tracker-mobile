// Pure, non-JSX logic behind MesoEditorDaysStep.tsx — see the code-style skill, "Screens keep
// the same split, one level up". `canContinueFromDays` is used by the route
// (app/meso-editor/new.tsx) to gate the shared footer's Continue button, not by this step's own
// content component.

import type { Animated } from 'react-native';

import { FULL_BODY, type Exercise } from '@domain/catalog';
import type { ExerciseSettings } from '@domain/exerciseConfig';
import { exerciseTypeOf } from '@domain/exerciseConfigBuilders';
import { withExerciseSettings, type ExerciseSettingsById } from '@domain/exerciseSettingsBuilders';
import { DEFAULT_EXERCISE_SETS } from '@domain/planValidators';
import type { WeekPlanExercise } from '@domain/plan';
import { getExerciseTypeIcon } from '@design/exerciseTypeIcon';
import { getExerciseTypeLabel } from '@design/exerciseTypeLabel';
import { formatClock } from '@design/formatClock';
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
  const order = existing.reduce((highest, exercise) => Math.max(highest, exercise.order), -1) + 1;
  const next: WeekPlanExercise = { exerciseId, order, sets: DEFAULT_EXERCISE_SETS };
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

/**
 * The line under the name: the muscle group, or — for an exercise without one (`fullBody`) — its
 * type, the way the library files it (10.1 FR-1): `Power`, `Timed work`, `Mobility`.
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
export function exerciseTypeIcon(exercisesById: ExercisesById, exerciseId: string): IconComponent | undefined {
  const exercise = exercisesById[exerciseId];
  if (!exercise || exerciseTypeOf(exercise) === 'strength' || exerciseDotColor(exercisesById, exerciseId)) {
    return undefined;
  }
  return getExerciseTypeIcon(exerciseTypeOf(exercise));
}

/** 08.5, "Шаг 3", and the power chip's value: `N sets`. */
export function formatSetCount(sets: number): string {
  return `${sets} ${sets === 1 ? 'set' : 'sets'}`;
}

/** The two lines of a hybrid row's plan chip (10.1 FR-9). */
export type ExercisePlan = { value: string; caption: string };

/**
 * The plan chip of a power, interval or mobility exercise, from the cycle's settings for it:
 * `3 sets` / `1:00 rest`, `3 × 2:00` / `1:00 rest`, `10:00` / `Length` (10.1 FR-9). A power
 * exercise's sets are the day's own (`WeekPlanExercise.sets`), as a strength one's are; an
 * interval's rounds belong to the cycle.
 */
export function formatExercisePlan(settings: ExerciseSettings, sets: number): ExercisePlan {
  switch (settings.type) {
    case 'power':
      return { value: formatSetCount(sets), caption: `${formatClock(settings.restSec)} rest` };
    case 'interval':
      return {
        value: `${settings.rounds} × ${formatClock(settings.workSec)}`,
        caption: `${formatClock(settings.restSec)} rest`,
      };
    case 'mobility':
      return { value: formatClock(settings.durationSec), caption: 'Length' };
  }
}

/**
 * The plan chip of the row, or `undefined` for a strength exercise (it keeps its sets stepper)
 * and for one not loaded yet. It shows the cycle's own copy of the settings (GT-158); a row the
 * cycle has no copy for yet — prefilled by Flow B or C — shows what that copy would start from,
 * the library's config.
 */
export function exercisePlan(
  exercisesById: ExercisesById,
  entry: WeekPlanExercise,
  exerciseSettings: ExerciseSettingsById = {},
): ExercisePlan | undefined {
  const exercise = exercisesById[entry.exerciseId];
  if (!exercise || exerciseTypeOf(exercise) === 'strength') {
    return undefined;
  }
  const settings = exerciseSettings[entry.exerciseId] ?? withExerciseSettings({}, exercise)[exercise.id];
  return settings ? formatExercisePlan(settings, entry.sets) : undefined;
}

/**
 * The header over the right-hand column: `Sets` while every row of the day is a sets stepper,
 * `Plan` once a plan chip shares the column (canvas 7.2).
 */
export function planColumnLabel(exercisesById: ExercisesById, exercises: readonly WeekPlanExercise[]): string {
  return exercises.some((entry) => exercisePlan(exercisesById, entry) !== undefined) ? 'Plan' : 'Sets';
}

export function exerciseTitle(exercisesById: ExercisesById, exerciseId: string): string {
  return exercisesById[exerciseId]?.name ?? '';
}
