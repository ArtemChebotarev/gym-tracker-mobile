// Pure, non-JSX logic behind ExerciseProgressionFields.tsx — see the code-style skill.

import type { IntervalLever, IntervalStepSec } from '@domain/exerciseConfig';

/** What each lever is called where it is picked (canvas 4.3, CreateInterval; FR-8). */
export const LEVER_LABEL: Record<IntervalLever, string> = {
  rest: 'Less rest',
  workTime: 'More work',
  rounds: 'More rounds',
  none: 'Keep plan',
};

/** Whether the lever moves a time, and so has a step (FR-8: `rounds` is always one). */
export function leverMovesTime(lever: IntervalLever): boolean {
  return lever === 'rest' || lever === 'workTime';
}

/** What a lever does, in the words of the plan — with the step where there is one. */
export function describeLever(lever: IntervalLever, stepSec: IntervalStepSec): string {
  switch (lever) {
    case 'rest':
      return `Finish every round and next week's rest is ${stepSec} s shorter.`;
    case 'workTime':
      return `Finish every round and next week's work is ${stepSec} s longer.`;
    case 'rounds':
      return 'Finish every round and next week has one more round.';
    case 'none':
      return 'The plan stays the same every week.';
  }
}
