// The time fields of a hybrid exercise's config as a form shows them — what each is called and
// what qualifies it. Shared by the New/Edit exercise page (ExerciseConfigFields.tsx) and the cycle
// editor's plan sheet (CyclePlanSheet.tsx, GT-92); the ranges are the config's own
// (`CONFIG_TIME_RANGE_SEC`), so a field accepts the same values wherever it is set.

import {
  CONFIG_TIME_RANGE_SEC,
  CONFIG_TIME_STEP_SEC,
  GET_READY_STEP_SEC,
  INTERVAL_REST_MIN_SEC,
  type ConfigTimeKey,
} from '@domain/exerciseConfig';

/**
 * A time field of a config: what it is called, what qualifies it, what it may hold, and the
 * seconds `−` / `+` and the picker's seconds wheel move by.
 */
export type TimeField = {
  key: ConfigTimeKey;
  label: string;
  suffix?: string;
  minSec: number;
  maxSec: number;
  stepSec: number;
};

function timeField(
  key: ConfigTimeKey,
  label: string,
  suffix?: string,
  overrides?: Partial<Pick<TimeField, 'minSec' | 'stepSec'>>,
): TimeField {
  const range = CONFIG_TIME_RANGE_SEC[key];
  return {
    key,
    label,
    suffix,
    minSec: range.min,
    maxSec: range.max,
    stepSec: CONFIG_TIME_STEP_SEC,
    ...overrides,
  };
}

export const REST_BETWEEN_SETS = timeField('restSec', 'Rest', 'between sets');
export const REST_BETWEEN_ROUNDS = timeField('restSec', 'Rest', 'between rounds', {
  minSec: INTERVAL_REST_MIN_SEC,
});
export const WORK = timeField('workSec', 'Work');
export const COUNTDOWN = timeField('getReadySec', 'Countdown', 'before round', {
  stepSec: GET_READY_STEP_SEC,
});
export const DURATION = timeField('durationSec', 'Duration');
