// A cycle's own copy of its hybrid exercises' configs (`Mesocycle.exerciseSettings`, 10.1 FR-9):
// how the copy is made when an exercise joins the cycle, put back to the library's values, and
// cut down to the exercises the cycle still has. The shapes are `domain/exerciseConfig.ts`'s; the
// one copy of a config is `defaultExerciseSettings`.
//
// The library holds only the starting values. Whatever the cycle changes lives in its copy, so an
// edit moves this cycle and neither the exercise nor any other cycle that uses it.

import type { Exercise } from './catalog';
import type { ExerciseSettings } from './exerciseConfig';
import type { WeekPlan } from './plan';
import { defaultExerciseConfig, defaultExerciseSettings, exerciseTypeOf } from './exerciseConfigBuilders';

/** Settings by exercise id — `Mesocycle.exerciseSettings`'s shape. */
export type ExerciseSettingsById = Record<string, ExerciseSettings>;

/**
 * What a cycle starts with for `exercise`: a copy of its library config, or `undefined` for a
 * `strength` one, which has nothing to copy. An exercise of a hybrid type stored without a config
 * gets its type's system defaults — the same values the library would have given it.
 */
function librarySettings(exercise: Exercise): ExerciseSettings | undefined {
  const config = exercise.config ?? defaultExerciseConfig(exerciseTypeOf(exercise));
  return config ? defaultExerciseSettings(config) : undefined;
}

/**
 * Adds the copy of `exercise`'s config to `settings` — the exercise has just been added to the
 * cycle (FR-9). Leaves `settings` as it is when the cycle already has a copy (the exercise is on
 * another day too, and that copy may have been edited) and for a `strength` exercise.
 */
export function withExerciseSettings(
  settings: ExerciseSettingsById,
  exercise: Exercise,
): ExerciseSettingsById {
  if (settings[exercise.id] !== undefined) {
    return settings;
  }
  const copy = librarySettings(exercise);
  return copy ? { ...settings, [exercise.id]: copy } : settings;
}

/**
 * `Reset to defaults` (FR-9): the cycle's copy for `exercise` goes back to the library's values,
 * rounds included. Nothing changes for a `strength` exercise.
 */
export function resetExerciseSettings(
  settings: ExerciseSettingsById,
  exercise: Exercise,
): ExerciseSettingsById {
  const copy = librarySettings(exercise);
  return copy ? { ...settings, [exercise.id]: copy } : settings;
}

/**
 * Keeps only the settings of exercises the cycle still has: one removed from every day leaves no
 * copy behind, so adding it again starts from the library rather than from an old edit.
 */
export function prunedExerciseSettings(
  settings: ExerciseSettingsById,
  exerciseIds: Iterable<string>,
): ExerciseSettingsById {
  const kept = new Set(exerciseIds);
  return Object.fromEntries(Object.entries(settings).filter(([id]) => kept.has(id)));
}

/**
 * The settings a cycle starts with for a week that arrives already filled in — Flow B's template
 * or Flow C's copied week (GT-159). For every hybrid exercise of `weekPlan`: what `inherited` has
 * for it, else a copy of its library config. Flow C passes the source cycle's own settings as
 * `inherited` — what actually ran — and Flow B passes nothing, so a template gives the library's.
 *
 * `exercises` holds the library records of the plan's exercises; one it lacks gets no settings,
 * and a `strength` one never has any. Settings `inherited` holds for an exercise the plan no
 * longer has are left behind.
 */
export function weekPlanExerciseSettings(
  weekPlan: WeekPlan,
  exercises: readonly Exercise[],
  inherited: ExerciseSettingsById = {},
): ExerciseSettingsById {
  const byId = new Map(exercises.map((exercise) => [exercise.id as string, exercise]));
  let settings: ExerciseSettingsById = {};
  for (const day of weekPlan.days) {
    for (const { exerciseId } of day.exercises) {
      const exercise = byId.get(exerciseId);
      if (!exercise || exerciseTypeOf(exercise) === 'strength' || settings[exerciseId]) {
        continue;
      }
      const own = inherited[exerciseId];
      settings = own ? { ...settings, [exerciseId]: { ...own } } : withExerciseSettings(settings, exercise);
    }
  }
  return settings;
}
