// The time fields of a hybrid exercise's config as a form shows them — what each is called and
// what qualifies it. Shared by the New/Edit exercise page (ExerciseConfigFields.tsx) and the cycle
// editor's plan sheet (CyclePlanSheet.tsx, GT-92); the ranges are the config's own
// (`CONFIG_TIME_RANGE_SEC`), so a field accepts the same values wherever it is set.

import { CONFIG_TIME_RANGE_SEC, type ConfigTimeKey } from '@domain/exerciseConfig';

/** A time field of a config: what it is called, what qualifies it, and what it may hold. */
export type TimeField = {
  key: ConfigTimeKey;
  label: string;
  suffix?: string;
  minSec: number;
  maxSec: number;
};

function timeField(key: ConfigTimeKey, label: string, suffix?: string): TimeField {
  const range = CONFIG_TIME_RANGE_SEC[key];
  return { key, label, suffix, minSec: range.min, maxSec: range.max };
}

export const REST_BETWEEN_SETS = timeField('restSec', 'Rest', 'between sets');
export const REST_BETWEEN_ROUNDS = timeField('restSec', 'Rest', 'between rounds');
export const WORK = timeField('workSec', 'Work');
export const COUNTDOWN = timeField('getReadySec', 'Countdown', 'before round');
export const DURATION = timeField('durationSec', 'Duration');
