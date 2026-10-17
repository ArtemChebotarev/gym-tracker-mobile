// Target-hit indicator — see 03 · Progression Engine, "Индикатор попадания в цель". Pure
// functions: they compare one logged set's reps with the reps that set was aiming for. Nothing
// here is stored and nothing affects anything — the engine never reads the marker back.

import { isResistanceBand } from '@domain/bodyWeightLoad';
import type { Equipment, ExerciseType } from '@domain/catalog';
import type { SetLog, SetTarget, TargetIndicator } from '@domain/execution';
import type { WeightSwap } from '@domain/weightSwap';
import { evaluateWeightSwap } from '@domain/weightSwapRules';

/**
 * Whether a set of this exercise is judged against its target (08.7, row mode `scored`) or only
 * guided by it (`guided`, 10.2 P11): power, and a resistance band, whose target is a placeholder
 * to aim at and never a mark to hit — a drop in reps after a heavier weight must not read as a
 * miss. One predicate by type and equipment, so a screen never decides this on its own.
 */
export function usesTargetIndicator(
  type: ExerciseType | undefined,
  equipment: Equipment | undefined,
): boolean {
  return type !== 'power' && !isResistanceBand(equipment);
}

/**
 * `hit` when the logged reps equal the set's target, `over` / `under` with the absolute rep
 * difference otherwise. Returns `undefined` when the set has no `targetReps` (e.g. week 1 of
 * Flow A/B, or the deload week), or when its numbers are only an estimate (task 134.1) — there is
 * no marker then.
 */
export function targetIndicator(
  target: Pick<SetTarget, 'targetReps' | 'estimate'>,
  log: Pick<SetLog, 'reps'>,
): TargetIndicator | undefined {
  if (target.targetReps === undefined || target.estimate !== undefined) {
    return undefined;
  }
  const diff = log.reps - target.targetReps;
  if (diff === 0) {
    return { kind: 'hit' };
  }
  return diff > 0 ? { kind: 'over', diff } : { kind: 'under', diff: -diff };
}

/**
 * The same marker for a set logged at some weight, with rule 7 in between (03 · Progression
 * Engine, "Правило 7"; task 120): a set done at another weight is judged against the reps *that*
 * weight was worth, not the ones the original weight was.
 *
 * `swap` absent — a deload set, a pure `bodyweight` one — leaves the plain comparison. In the
 * `estimate` and `out` zones there is no marker at all: the number there is a guide or nothing,
 * and a `✓` against it would claim a precision the formula doesn't have.
 */
export function targetIndicatorAtWeight(
  target: Pick<SetTarget, 'targetReps' | 'estimate'>,
  log: Pick<SetLog, 'reps' | 'weight' | 'bodyWeight'>,
  swap: WeightSwap | undefined,
): TargetIndicator | undefined {
  if (target.estimate !== undefined || swap === undefined || 'unavailable' in swap) {
    return targetIndicator(target, log);
  }
  const evaluation = evaluateWeightSwap(swap, log.weight, log.bodyWeight);
  if (evaluation === undefined || evaluation.zone === 'estimate' || evaluation.zone === 'out') {
    return undefined;
  }
  return targetIndicator({ targetReps: evaluation.reps }, log);
}
