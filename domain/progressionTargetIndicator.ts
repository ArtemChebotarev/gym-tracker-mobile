// Target-hit indicator — see 03 · Progression Engine, "Индикатор попадания в цель". Pure
// function: compares one logged set's reps with that set's `targetReps`. It stores nothing
// and affects nothing — the engine never reads it back.

import type { SetLog, SetTarget, TargetIndicator } from '@domain/execution';

/**
 * `hit` when the logged reps equal the set's target, `over` / `under` with the absolute rep
 * difference otherwise. Returns `undefined` when the set has no `targetReps` (e.g. week 1 of
 * Flow A/B, or the deload week) — there is no marker then.
 */
export function targetIndicator(
  target: Pick<SetTarget, 'targetReps'>,
  log: Pick<SetLog, 'reps'>,
): TargetIndicator | undefined {
  if (target.targetReps === undefined) {
    return undefined;
  }
  const diff = log.reps - target.targetReps;
  if (diff === 0) {
    return { kind: 'hit' };
  }
  return diff > 0 ? { kind: 'over', diff } : { kind: 'under', diff: -diff };
}
