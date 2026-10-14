// Defaults for a hybrid exercise's config and the reading of its type — see
// `domain/exerciseConfig.ts` for the shapes. The numbers are the system defaults of 10.1 FR-9;
// the corridors and steps the progression engine uses are its own and arrive with it.

import type { Exercise, ExerciseType } from './catalog';
import type { ExerciseConfig, IntervalConfig } from './exerciseConfig';

/**
 * The type of `exercise`, `strength` where it says nothing. The one place that default is
 * written, so a reader never repeats it.
 */
export function exerciseTypeOf(exercise: Pick<Exercise, 'type'>): ExerciseType {
  return exercise.type ?? 'strength';
}

/**
 * The "Hold" preset of an `interval` exercise (10.1 FR-10, "Timed work"): a plank or a hang as
 * 3 x 0:30 with a minute's rest, progressing on `workTime` in 5 s steps. The `interval` key stays;
 * "Timed work" is only its label in the UI. Fresh object each call, like the defaults.
 */
export function holdIntervalConfig(): IntervalConfig {
  return {
    type: 'interval',
    rounds: 3,
    workSec: 30,
    restSec: 60,
    getReadySec: 5,
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
      return { type: 'power', load: 'weight', restSec: 60, noHeavierAvailable: false };
    case 'interval':
      return {
        type: 'interval',
        rounds: 3,
        workSec: 120,
        restSec: 60,
        getReadySec: 5,
        lever: 'rest',
        stepSec: 15,
      };
    case 'mobility':
      return { type: 'mobility', durationSec: 600 };
  }
}
