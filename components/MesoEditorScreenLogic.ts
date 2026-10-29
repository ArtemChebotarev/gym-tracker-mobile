import type { Exercise, ExerciseId } from '@domain/catalog';
import type { ExerciseListGroup } from '@domain/catalogListing';
import { DEFAULT_INTERVAL_ROUNDS, exerciseTypeOf } from '@domain/exerciseConfigBuilders';
import { prunedExerciseSettings, withExerciseSettings } from '@domain/exerciseSettingsBuilders';
import { DEFAULT_EXERCISE_SETS } from '@domain/planValidators';
import type { MesoBuilderDraft } from '@state/draftStore';

import { addExerciseToDay, removeExerciseFromDay } from './MesoEditorDaysStepLogic';

/**
 * Whether closing the wizard would throw something away (GT-52, 08.11 / 08.5): a name typed,
 * exercises added, a template applied or a week copied. The steppers don't count — a cycle length
 * nudged and nothing else isn't worth a question — so a fresh wizard, and Flow B's template list
 * before anything is chosen, close at once. The draft is the only copy (nothing about a new cycle
 * is stored before Save), which is why this asks.
 */
export function hasUnsavedDraft(draft: MesoBuilderDraft): boolean {
  return (
    draft.name.trim() !== '' ||
    draft.templateId !== undefined ||
    draft.source !== undefined ||
    Object.values(draft.exercisesByDay).some((exercises) => exercises.length > 0)
  );
}

/** The confirmation raised by ✕ (and Android's back) when `hasUnsavedDraft`: a question and two buttons. */
export const DISCARD_DRAFT_TITLE = 'Discard training cycle?';
export const DISCARD_DRAFT_MESSAGE = "What you've entered won't be saved.";
export const KEEP_EDITING_LABEL = 'Keep editing';
export const DISCARD_LABEL = 'Discard';

/**
 * The records of the exercises selected in Add exercise, kept as the selection changes. A row can
 * only be ticked while the sheet lists it, so its record is in `groups` at that moment — but not
 * necessarily at confirm: a new search replaces the list, and what was ticked under the old one is
 * still selected. Records of ids no longer selected are dropped.
 */
export function rememberSelectedExercises(
  remembered: Readonly<Record<string, Exercise>>,
  groups: readonly ExerciseListGroup[] | undefined,
  ids: readonly ExerciseId[],
): Record<string, Exercise> {
  const listed = new Map<string, Exercise>();
  for (const group of groups ?? []) {
    for (const entry of group.entries) {
      listed.set(entry.exercise.id, entry.exercise);
    }
  }
  const next: Record<string, Exercise> = {};
  for (const id of ids) {
    const exercise = remembered[id] ?? listed.get(id);
    if (exercise) {
      next[id] = exercise;
    }
  }
  return next;
}

/** What a new row starts with: an interval one round (GT-183), any other the default sets. */
function startingSets(exercise: Exercise | undefined): number {
  return exercise !== undefined && exerciseTypeOf(exercise) === 'interval'
    ? DEFAULT_INTERVAL_ROUNDS
    : DEFAULT_EXERCISE_SETS;
}

/**
 * Add exercise's confirm: appends every id to `dayNumber` and gives the cycle its own copy of each
 * hybrid one's library config (10.1 FR-9, GT-158) — unless the cycle already has one, from the
 * same exercise on another day. `exercisesById` holds the records to copy from.
 */
export function addExercisesToDraft(
  draft: MesoBuilderDraft,
  dayNumber: number,
  ids: readonly ExerciseId[],
  exercisesById: Readonly<Record<string, Exercise>>,
): MesoBuilderDraft {
  return {
    ...draft,
    exercisesByDay: ids.reduce(
      (exercisesByDay, id) => addExerciseToDay(exercisesByDay, dayNumber, id, startingSets(exercisesById[id])),
      draft.exercisesByDay,
    ),
    exerciseSettings: ids
      .flatMap((id) => exercisesById[id] ?? [])
      .reduce(withExerciseSettings, draft.exerciseSettings ?? {}),
  };
}

/**
 * Removes the row at `index` of `dayNumber`. An exercise that leaves the cycle altogether — no
 * other day has it — takes its settings with it, so adding it back starts from the library.
 */
export function removeExerciseFromDraft(
  draft: MesoBuilderDraft,
  dayNumber: number,
  index: number,
): MesoBuilderDraft {
  const exercisesByDay = removeExerciseFromDay(draft.exercisesByDay, dayNumber, index);
  const remainingIds = Object.values(exercisesByDay).flatMap((exercises) =>
    exercises.map((exercise) => exercise.exerciseId),
  );
  return {
    ...draft,
    exercisesByDay,
    exerciseSettings: prunedExerciseSettings(draft.exerciseSettings ?? {}, remainingIds),
  };
}
