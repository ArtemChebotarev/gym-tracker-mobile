// What a round passes on to the round planned after it — one more round of the same exercise
// (Add round, GT-91) or the same round next week (GT-93; 03, "Структура наследуется от факта").
// A round's times are its plan, not a goal it can miss, so the fact replaces the plan as it is:
// the times a round was done with, its planned ones while it isn't logged. A one-off is no new plan
// (10.1, FR-6, FR-8): a round ended early keeps the planned work, a skipped rest the planned rest.
// Pure.

import type { RoundLog, SetTarget } from '@domain/execution';

export type RoundTimes = Pick<SetTarget, 'targetWorkSec' | 'targetRestSec'>;

/**
 * The times `planned` (a round's target) hands on, given its log if it is logged. A target with no
 * times and nothing logged gives none, and the card falls back on the cycle's plan.
 */
export function roundTimesOf(
  planned: RoundTimes | undefined,
  log?: Pick<RoundLog, 'workSec' | 'restSec' | 'restSkipped' | 'completed'>,
): RoundTimes {
  const times: RoundTimes = {};
  const workSec = log?.completed ? log.workSec : planned?.targetWorkSec;
  if (workSec !== undefined) {
    times.targetWorkSec = workSec;
  }
  const restSec = (log?.restSkipped === false ? log.restSec : undefined) ?? planned?.targetRestSec;
  if (restSec !== undefined) {
    times.targetRestSec = restSec;
  }
  return times;
}
