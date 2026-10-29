// Defaults for a hybrid exercise's config and the reading of its type — see
// `domain/exerciseConfig.ts` for the shapes. The lever and step are the system defaults of 10.1
// FR-9; there is no default time (GT-191).

import type { Exercise, ExerciseType } from './catalog';
import type { ExerciseConfig, ExerciseSettings, IntervalConfig } from './exerciseConfig';

/**
 * The type of `exercise`, `strength` where it says nothing. The one place that default is
 * written, so a reader never repeats it.
 */
export function exerciseTypeOf(exercise: Pick<Exercise, 'type'>): ExerciseType {
  return exercise.type ?? 'strength';
}

/**
 * The "Hold" preset of an `interval` exercise (10.1 FR-16, "Timed work"): a plank or a hang,
 * progressing on `workTime` in 5 s steps; its times come from history, as every interval's do.
 * The `interval` key stays; "Timed work" is only its label in the UI. Fresh object each call,
 * like the defaults.
 */
export function holdIntervalConfig(): IntervalConfig {
  return {
    type: 'interval',
    lever: 'workTime',
    stepSec: 5,
  };
}

/**
 * What a new exercise of `type` starts with (10.1, FR-9, "Системные дефолты при создании").
 * `undefined` for `strength`, which has no config.
 *
 * Returns a fresh object each call: the caller edits it into the exercise's own values, and two
 * exercises must never share one.
 */
export function defaultExerciseConfig(type: ExerciseType): ExerciseConfig | undefined {
  switch (type) {
    case 'strength':
      return undefined;
    case 'power':
      return { type: 'power', load: 'weight', noHeavierAvailable: false };
    case 'interval':
      return {
        type: 'interval',
        lever: 'rest',
        // The smallest step by default (Artem, 27.10.2026).
        stepSec: 5,
      };
    case 'mobility':
      return { type: 'mobility' };
  }
}

/**
 * How many rounds a new interval exercise has on its day of the cycle editor (10.1 FR-9, GT-183):
 * one, rather than a strength exercise's `DEFAULT_EXERCISE_SETS` — the stepper adds more.
 */
export const DEFAULT_INTERVAL_ROUNDS = 1;

/**
 * What a cycle keeps for a hybrid exercise (`Mesocycle.exerciseSettings`, 10.1 FR-8): a copy of
 * the library's `config`. Fresh object each call, so the cycle's copy never shares one with the
 * library.
 */
export function defaultExerciseSettings(config: ExerciseConfig): ExerciseSettings {
  return { ...config };
}
