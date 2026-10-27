// Pure, non-JSX logic behind CyclePlanSheet.tsx — see the code-style skill.

import {
  INTERVAL_LEVERS,
  INTERVAL_STEPS_SEC,
  type IntervalLever,
  type IntervalStepSec,
} from '@domain/exerciseConfig';

import { PLAN_LEVER_LABEL } from './MesoEditorDaysStepLogic';

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
