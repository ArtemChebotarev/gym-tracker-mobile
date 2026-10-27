// Pure, non-JSX logic behind CyclePlanSheet.tsx — see the code-style skill.

import {
  INTERVAL_LEVERS,
  type ConfigTimeKey,
  INTERVAL_STEPS_SEC,
  type IntervalLever,
  type IntervalStepSec,
} from '@domain/exerciseConfig';

import type { PlanSettings } from './MesoEditorDaysStepLogic';

/**
 * What each lever is called on the plan sheet's segmented control (10.1 FR-8, canvas 7.3): four
 * segments in one row, so the short words of FR-8 rather than the library's option cards' titles.
 * `none` reads "None", as in the library (Artem, 18.10.2026), not 7.3's "Keep".
 */
export const PLAN_LEVER_LABEL: Record<IntervalLever, string> = {
  rest: 'Less rest',
  workTime: 'More work',
  rounds: '+1 round',
  none: 'None',
};

export const PLAN_LEVER_OPTIONS = INTERVAL_LEVERS.map((lever) => ({
  value: lever,
  label: PLAN_LEVER_LABEL[lever],
}));

export const PLAN_STEP_OPTIONS = INTERVAL_STEPS_SEC.map((sec) => ({
  value: String(sec),
  label: `${sec} s`,
}));

/** The lever a segment's value stands for. Throws on a value the control never offers. */
export function leverFromValue(value: string): IntervalLever {
  const lever = INTERVAL_LEVERS.find((candidate) => candidate === value);
  if (lever === undefined) {
    throw new Error(`Unknown interval lever "${value}".`);
  }
  return lever;
}

/** The step a segment's value stands for. Throws on a value the control never offers. */
export function stepFromValue(value: string): IntervalStepSec {
  const step = INTERVAL_STEPS_SEC.find((candidate) => String(candidate) === value);
  if (step === undefined) {
    throw new Error(`Unknown interval step "${value}".`);
  }
  return step;
}

/** The line under the sheet's title: whose plan it is (canvas 7.3). */
export function planSheetSubtitle(dayNumber: number): string {
  return `Plan for this training cycle · Day ${dayNumber}`;
}

/**
 * `settings` with one time field set — the keys a plan sheet edits. A key the settings' type
 * has no such field for leaves them as they are.
 */
export function withTimeField(
  settings: PlanSettings,
  key: ConfigTimeKey,
  valueSec: number,
): PlanSettings {
  return key in settings ? ({ ...settings, [key]: valueSec } as PlanSettings) : settings;
}

/** The value of one time field of `settings`, 0 where its type has no such field. */
export function timeFieldValue(
  settings: PlanSettings,
  key: ConfigTimeKey,
): number {
  return (settings as Partial<Record<typeof key, number>>)[key] ?? 0;
}
