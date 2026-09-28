// Progression engine, rule 6 — targets for an exercise with no source session. See 03 ·
// Progression Engine, "Правило 6 — цели для упражнения без сессии-источника". An exercise
// added or swapped in mid-session has no set rows of its own to progress from, so its targets
// come from history instead. Reading the performances inside `historyLookbackDays` is the use
// case layer's job; which of them to build on is the reference resolver's
// (`domain/progressionReference.ts`, task 134.1); this turns its answer into set targets.

import { isPureBodyWeight } from '@domain/bodyWeightLoad';
import type { Equipment } from '@domain/catalog';
import type { SetLog, SetTarget } from '@domain/execution';
import type { ProgressionSettings } from '@domain/mesocycle';
import type { ReferenceResolution } from '@domain/progression';
import { nextTargetReps, startTargetReps } from '@domain/progressionReps';
import { weightHintForReps } from '@domain/progressionWeightHint';

type RepCorridor = Pick<ProgressionSettings, 'minReps' | 'maxReps'>;

/**
 * The reps an estimate's set N stands at (03, "Оценка"; task 134.1), by where its reference came
 * from. Progression doesn't stop at the slot boundary — only the claim to precision does:
 *
 * - an earlier week of the own block: + 1, a week of progression as rule 2 would add;
 * - another block: + 1 and the RIR gap, as Flow C carries a block over (`startTargetReps`);
 * - the current week: reps as they were — a parallel performance, not a previous one.
 */
function estimatedReps(
  reference: SetLog,
  resolution: Extract<ReferenceResolution, { kind: 'estimate' }>,
  weekRir: number,
  settings: RepCorridor,
): number {
  switch (resolution.source) {
    case 'earlier_week':
      return nextTargetReps(reference.reps, settings);
    case 'other_block':
      return startTargetReps(reference.reps, resolution.reference.targetRir, weekRir, settings);
    case 'current_week':
      return reference.reps;
  }
}

/**
 * The reference set row `setNumber` (1-based) takes: the reference's N-th set in `setNumber`
 * order, or its last set when the reference has fewer sets than the row number. `undefined`
 * only when there is no reference at all.
 */
export function referenceSetFor(
  referenceLogs: readonly SetLog[],
  setNumber: number,
): SetLog | undefined {
  const sorted = [...referenceLogs].sort((a, b) => a.setNumber - b.setNumber);
  return sorted[setNumber - 1] ?? sorted[sorted.length - 1];
}

/**
 * Set targets for `rowCount` rows of an exercise added or swapped in mid-session during a
 * working week, from what the reference resolver found for it (`resolveReference`, task 134.1):
 *
 * - `target` — the reference is in the exercise's own slot: `targetReps` = reference reps + 1
 *   clamped to the corridor (as rule 2), `suggestedWeight` = the reference weight as is, and a
 *   weight hint from the reference reps (rule 3).
 * - `estimate` — numbers from another day or block, priced by where they came from
 *   (`estimatedReps`), the reference weight as is, no weight hint, each row marked with the
 *   reason (03, "Оценка"). `weekRir` — the target RIR of the week the rows are for — is what an
 *   estimate from another block is re-priced to.
 * - `none` — neither: the screen falls back to showing `N RIR`.
 *
 * Row N takes the reference's set N, or its last set past the end (`referenceSetFor`). A pure
 * `bodyweight` exercise takes the reps and skips the weight and the hint, as everywhere else
 * (task 105, `domain/bodyWeightLoad.ts`).
 *
 * Not called in the deload week: an exercise can't be added there, and one swapped in gets no
 * weight or reps at all — the week isn't for progression, so its RIR is guidance enough and no
 * reference is looked up. The rows' `targetRir` isn't set here either: it always comes from the
 * current week (rule 4, or 5 for deload), never from the reference.
 */
export function prescribeFromHistory(
  resolution: ReferenceResolution,
  rowCount: number,
  weekRir: number,
  settings: RepCorridor,
  equipment?: Equipment,
): SetTarget[] {
  const carriesWeight = !isPureBodyWeight(equipment);
  return Array.from({ length: rowCount }, (_, index): SetTarget => {
    const setNumber = index + 1;
    const reference =
      resolution.kind === 'none'
        ? undefined
        : referenceSetFor(resolution.reference.setLogs, setNumber);
    if (reference === undefined) {
      return { setNumber };
    }
    if (resolution.kind === 'estimate') {
      const estimate: SetTarget = {
        setNumber,
        targetReps: estimatedReps(reference, resolution, weekRir, settings),
      };
      if (carriesWeight) {
        estimate.suggestedWeight = reference.weight;
      }
      estimate.estimate = resolution.reason;
      return estimate;
    }
    const target: SetTarget = {
      setNumber,
      targetReps: nextTargetReps(reference.reps, settings),
    };
    if (carriesWeight) {
      target.suggestedWeight = reference.weight;
      const hint = weightHintForReps(reference.reps, settings);
      if (hint !== undefined) {
        target.weightHint = hint;
      }
    }
    return target;
  });
}
