// Flow C start targets — see 04 · Meso Creation Flows, "Расчёт startReps". A block copied from
// a past week takes the reference one rep further, as progression always does, and then gives
// back the RIR gap: the new block starts at a higher RIR than the one its reference was
// performed at, so the same weight is worth fewer reps there. This is the arithmetic for that;
// it sits next to `prescribeFromHistory` (rule 6) on purpose: same reference performance,
// different sum.
//
// Pure and timeless, like the rest of the engine. Reading the history window is the use case
// layer's job, and which performance each day builds on is the reference resolver's
// (`domain/progressionReference.ts`, task 134.2) — nothing here reads storage or a clock.

import { isPureBodyWeight } from '@domain/bodyWeightLoad';
import type { Equipment } from '@domain/catalog';
import type { SetTarget } from '@domain/execution';
import type { ProgressionSettings } from '@domain/mesocycle';
import type { ReferenceResolution } from '@domain/progression';
import { referenceSetAt } from '@domain/progressionHistory';
import { startTargetReps } from '@domain/progressionReps';

type RepCorridor = Pick<ProgressionSettings, 'minReps' | 'maxReps'>;

// `startTargetReps` lives with the rest of the rep arithmetic now that rule 6's estimate from
// another block uses it too (task 134.1); Flow C's callers keep reaching it here.
export { startTargetReps };

/**
 * Week 1 set targets for one slot of a `copyWeek` mesocycle, from what the reference resolver
 * found for that day (`resolveReference`, task 134.2): `rowCount` rows (numbered from 1), row N
 * priced from the reference's set N and nothing else, as in rule 6 (`referenceSetAt`) — a row the
 * reference has no set for gets no numbers, and reference sets past the row count are left out.
 *
 * - `target` — `targetReps` by `startTargetReps`, `suggestedWeight` = the reference weight as is
 *   (04 · Meso Creation Flows: "suggestedWeight(N) = референс.weight(N)").
 * - `estimate` — the same numbers, marked as an estimate (03, "Оценка"): the difference is in the
 *   label and the behaviour, not the sum. Its `source` isn't read: the resolver names it against
 *   the block being copied, not the one starting, so every source here is a step over a block
 *   boundary and gets the RIR gap (unlike `prescribeFromHistory`'s `earlier_week`).
 * - `none` — neither target: the screen falls back to `N RIR`, the same "не уверен — не
 *   рекомендуй" rule as everywhere else, not a Flow C special case.
 *
 * No weight hint: rule 3's hint reads the *last* performance's reps against the corridor to say
 * "go heavier / go lighter" for the week that follows it. Here the reference may be blocks old
 * and the reps are being re-priced for a different RIR, so the direction it would name isn't the
 * one the user is about to work at. The spec's formula lists reps and weight, and nothing else.
 *
 * A pure `bodyweight` exercise takes the reps and skips the weight, as everywhere else (105).
 */
export function prescribeBlockStart(
  resolution: ReferenceResolution,
  startRir: number,
  rowCount: number,
  settings: RepCorridor,
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
    const target: SetTarget = {
      setNumber,
      targetReps: startTargetReps(
        reference.reps,
        resolution.reference.targetRir,
        startRir,
        settings,
      ),
    };
    if (carriesWeight) {
      target.suggestedWeight = reference.weight;
    }
    if (resolution.kind === 'estimate') {
      target.estimate = resolution.reason;
    }
    return target;
  });
}
