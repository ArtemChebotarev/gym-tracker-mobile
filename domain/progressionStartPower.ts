// Flow C for `power` — week 1's rows of a copied block. See 10.2 · Power progression (P14) and 04 ·
// Meso Creation Flows, "Расчёт startReps". Same sum as strength's, `reference + 1` minus the gap
// between the new block's RIR and the reference's, with two differences: nothing clamps it to a
// corridor, and a result of 0 or less is no recommendation — the row stays bare instead of being
// lifted to a minimum nobody asked for.

import { isPureBodyWeight } from '@domain/bodyWeightLoad';
import type { Equipment } from '@domain/catalog';
import type { SetTarget } from '@domain/execution';
import type { ReferenceResolution } from '@domain/progression';
import { UNBOUNDED_CORRIDOR, usableReps } from '@domain/progressionCorridor';
import { referenceSetAt } from '@domain/progressionHistory';
import { startTargetReps } from '@domain/progressionReps';

/**
 * `rowCount` rows (numbered from 1), row N priced from the reference's set N and nothing else
 * (`referenceSetAt`): `targetReps` by `startTargetReps` with no clamp, `suggestedWeight` the
 * reference weight as is, marked as an estimate when the resolver says so. No weight hint — the
 * reference may be blocks old and priced for another RIR (as for strength). A row with no
 * reference set, or whose sum is 0 or less, gets no numbers.
 */
export function prescribePowerBlockStart(
  resolution: ReferenceResolution,
  startRir: number,
  rowCount: number,
  equipment?: Equipment,
): SetTarget[] {
  const carriesWeight = !isPureBodyWeight(equipment);
  return Array.from({ length: rowCount }, (_, index): SetTarget => {
    const setNumber = index + 1;
    const reference =
      resolution.kind === 'none'
        ? undefined
        : referenceSetAt(resolution.reference.setLogs, setNumber);
    if (resolution.kind === 'none' || reference === undefined) {
      return { setNumber };
    }
    const reps = usableReps(
      startTargetReps(reference.reps, resolution.reference.targetRir, startRir, UNBOUNDED_CORRIDOR),
    );
    if (reps === undefined) {
      return { setNumber };
    }
    const target: SetTarget = { setNumber, targetReps: reps };
    if (carriesWeight) {
      target.suggestedWeight = reference.weight;
    }
    if (resolution.kind === 'estimate') {
      target.estimate = resolution.reason;
    }
    return target;
  });
}
