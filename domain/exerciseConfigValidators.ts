// What an exercise's type and config have to satisfy before they are stored — see
// `domain/exerciseConfig.ts` for the shapes and 10.1 FR-1, FR-8, FR-9 for the rules.

import {
  EXERCISE_TYPES,
  FULL_BODY,
  isCatalogMuscleGroup,
  type ExerciseType,
  type MuscleGroup,
} from './catalog';
import { ConflictError } from './errors';
import {
  CONFIG_TIME_RANGE_SEC,
  INTERVAL_LEVERS,
  INTERVAL_REST_MIN_SEC,
  INTERVAL_STEPS_SEC,
  POWER_LOADS,
  type ExerciseConfig,
} from './exerciseConfig';

function assertWholeSeconds(value: number, what: string, min: number, max = Infinity): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    const range = max === Infinity ? `at least ${min}` : `from ${min} to ${max}`;
    throw new Error(`${what} must be a whole number ${range}, got ${value}.`);
  }
}

/** Throws unless `type` is one of `EXERCISE_TYPES`. */
export function validateExerciseType(type: ExerciseType): void {
  if (!EXERCISE_TYPES.includes(type)) {
    throw new Error(`Unknown exercise type: "${type}".`);
  }
}

/**
 * Throws unless `muscleGroup` is allowed on an exercise of `type`: a `strength` exercise is filed
 * under one of the twelve groups — it is counted into volume by it — while the other types may
 * also be `fullBody`, having no one group (10 · Hybrid Exercises).
 */
export function validateExerciseMuscleGroupFor(type: ExerciseType, muscleGroup: MuscleGroup): void {
  if (isCatalogMuscleGroup(muscleGroup) || (type !== 'strength' && muscleGroup === FULL_BODY)) {
    return;
  }
  throw new Error(
    muscleGroup === FULL_BODY
      ? 'A strength exercise needs a muscle group; "fullBody" is for the other types.'
      : `Unknown muscle group: "${muscleGroup}".`,
  );
}

/**
 * Throws unless `config` is what an exercise of `type` carries: none for `strength`, and for the
 * others the config tagged with that same type and holding sensible numbers.
 */
export function validateExerciseConfig(
  type: ExerciseType,
  config: ExerciseConfig | undefined,
): void {
  if (type === 'strength') {
    if (config !== undefined) {
      throw new Error('A strength exercise has no config.');
    }
    return;
  }
  if (config === undefined) {
    throw new Error(`A ${type} exercise needs a config.`);
  }
  if (config.type !== type) {
    throw new Error(`A ${type} exercise cannot carry a ${config.type} config.`);
  }

  switch (config.type) {
    case 'power':
      if (!POWER_LOADS.includes(config.load)) {
        throw new Error(`Unknown power load: "${config.load}".`);
      }
      assertWholeSeconds(config.restSec, 'Rest', 0);
      return;
    case 'interval':
      assertWholeSeconds(config.workSec, 'Work time', 1);
      assertWholeSeconds(config.restSec, 'Rest', INTERVAL_REST_MIN_SEC);
      assertWholeSeconds(
        config.getReadySec,
        'Get ready',
        CONFIG_TIME_RANGE_SEC.getReadySec.min,
        CONFIG_TIME_RANGE_SEC.getReadySec.max,
      );
      if (!INTERVAL_LEVERS.includes(config.lever)) {
        throw new Error(`Unknown interval lever: "${config.lever}".`);
      }
      if (!INTERVAL_STEPS_SEC.includes(config.stepSec)) {
        throw new Error(`Interval step must be one of ${INTERVAL_STEPS_SEC.join(', ')} seconds.`);
      }
      return;
    case 'mobility':
      assertWholeSeconds(config.durationSec, 'Duration', 1);
      return;
  }
}

/**
 * Throws a `ConflictError` when an exercise that already has logged history is given a different
 * type (10 · Hybrid Exercises: "Смена `type` у упражнения с историей запрещена"). The metrics of
 * the types do not convert into each other — a set of repeats is not a round of seconds — so the
 * way to "change" one is a new exercise and hiding the old.
 *
 * `hasHistory` is the caller's answer to "has anything been logged for this exercise"; the domain
 * does not read storage.
 */
export function assertTypeUnchanged(
  current: ExerciseType,
  next: ExerciseType,
  hasHistory: boolean,
): void {
  if (hasHistory && current !== next) {
    throw new ConflictError(
      `An exercise with logged history cannot change type from ${current} to ${next}; create a new exercise and hide this one.`,
    );
  }
}
