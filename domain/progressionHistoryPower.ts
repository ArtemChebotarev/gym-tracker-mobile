// Rule 6 for `power` — targets for a power exercise with no source session. See 10.2 · Power
// progression (P13) and 03, "Правило 6". Reading the history window is the use case layer's job and
// which performance to build on is the reference resolver's (`domain/progressionReference.ts`);
// this turns its answer into set rows the power way: one rep on top of the reference with no clamp
// to a corridor, a hint only from the top of it, and no numbers when the sum is 0 or less.

import { isPureBodyWeight } from '@domain/bodyWeightLoad';
import type { Equipment } from '@domain/catalog';
import type { SetTarget } from '@domain/execution';
import type { ReferenceResolution } from '@domain/progression';
import { UNBOUNDED_CORRIDOR, powerWeightHint, usableReps } from '@domain/progressionCorridor';
import { estimatedReps, referenceSetAt } from '@domain/progressionHistory';

/**
 * `rowCount` rows (numbered from 1), row N priced from the reference's set N and nothing else, as
 * for every type (`referenceSetAt`). A `target` reference gives reference reps + 1, its weight as
 * is, and a hint from the top of the corridor; an `estimate` gives the numbers priced by where
 * they came from (`estimatedReps`), marked with the reason and with no hint. A row the reference
 * has no set for, or one whose sum is 0 or less, stays bare — `N RIR` on a strength card, empty on
 * a power one.
 */
export function prescribePowerFromReference(
  resolution: ReferenceResolution,
  rowCount: number,
  weekRir: number,
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
    if (resolution.kind === 'estimate') {
      const reps = usableReps(estimatedReps(reference, resolution, weekRir, UNBOUNDED_CORRIDOR));
      if (reps === undefined) {
        return { setNumber };
      }
      const estimate: SetTarget = { setNumber, targetReps: reps };
      if (carriesWeight) {
        estimate.suggestedWeight = reference.weight;
      }
      estimate.estimate = resolution.reason;
      return estimate;
    }
    const reps = usableReps(reference.reps + 1);
    if (reps === undefined) {
      return { setNumber };
    }
    const target: SetTarget = { setNumber, targetReps: reps };
    if (carriesWeight) {
      target.suggestedWeight = reference.weight;
    }
    const hint = powerWeightHint(reference.reps, equipment);
    if (hint !== undefined) {
      target.weightHint = hint;
    }
    return target;
  });
}
