// Flow C start targets — see 04 · Meso Creation Flows, "Расчёт startReps". A block copied from
// a past week takes the reference one rep further, as progression always does, and then gives
// back the RIR gap: the new block starts at a higher RIR than the one its reference was
// performed at, so the same weight is worth fewer reps there. This is the arithmetic for that;
// it sits next to `prescribeFromHistory` (rule 6) on purpose: same reference performance,
// different sum.
//
// Pure and timeless, like the rest of the engine. Finding the reference performance and its
// `targetRir` is the use case layer's job (task 122) — nothing here reads storage or a clock.

import { isPureBodyWeight } from '@domain/bodyWeightLoad';
import type { Equipment } from '@domain/catalog';
import type { SetLog, SetTarget } from '@domain/execution';
import type { ProgressionSettings } from '@domain/mesocycle';
import { referenceSetFor } from '@domain/progressionHistory';
import { startTargetReps } from '@domain/progressionReps';

type RepCorridor = Pick<ProgressionSettings, 'minReps' | 'maxReps'>;

// `startTargetReps` lives with the rest of the rep arithmetic now that rule 6's estimate from
// another block uses it too (task 134.1); Flow C's callers keep reaching it here.
export { startTargetReps };

/**
 * Week 1 set targets for one exercise of a `copyWeek` mesocycle: `rowCount` rows (numbered from
 * 1), each priced from the reference's set of the same number — its last set once the rows run
 * past it, as in rule 6 (`referenceSetFor`).
 *
 * - Reference found: `targetReps` by `startTargetReps`, `suggestedWeight` = the reference weight
 *   as is (04 · Meso Creation Flows: "suggestedWeight(N) = референс.weight(N)").
 * - No reference (`null` or empty): neither target — the screen falls back to `N RIR`, the same
 *   "не уверен — не рекомендуй" rule as everywhere else, not a Flow C special case.
 *
 * No weight hint: rule 3's hint reads the *last* performance's reps against the corridor to say
 * "go heavier / go lighter" for the week that follows it. Here the reference may be blocks old
 * and the reps are being re-priced for a different RIR, so the direction it would name isn't the
 * one the user is about to work at. The spec's formula lists reps and weight, and nothing else.
 *
 * A pure `bodyweight` exercise takes the reps and skips the weight, as everywhere else (105).
 */
export function prescribeBlockStart(
  referenceLogs: readonly SetLog[] | null,
  referenceTargetRir: number,
  startRir: number,
  rowCount: number,
  settings: RepCorridor,
  equipment?: Equipment,
): SetTarget[] {
  const carriesWeight = !isPureBodyWeight(equipment);
  return Array.from({ length: rowCount }, (_, index): SetTarget => {
    const setNumber = index + 1;
    const reference =
      referenceLogs === null ? undefined : referenceSetFor(referenceLogs, setNumber);
    if (reference === undefined) {
      return { setNumber };
    }
    const target: SetTarget = {
      setNumber,
      targetReps: startTargetReps(reference.reps, referenceTargetRir, startRir, settings),
    };
    if (carriesWeight) {
      target.suggestedWeight = reference.weight;
    }
    return target;
  });
}
