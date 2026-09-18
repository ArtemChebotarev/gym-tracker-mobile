// Progression engine, rule 6 — targets for an exercise with no source session. See 03 ·
// Progression Engine, "Правило 6 — цели для упражнения без сессии-источника". An exercise
// added or swapped in mid-session has no set rows of its own to progress from, so its targets
// come from its last performance instead. Finding that reference (this mesocycle, or the last
// `historyLookbackDays` days) is the use case layer's job — the engine only sees the result.

import type { SetLog, SetTarget } from '@domain/execution';
import type { ProgressionSettings } from '@domain/mesocycle';
import { nextTargetReps } from '@domain/progressionReps';
import { weightHintForReps } from '@domain/progressionWeightHint';

type HistorySettings = Pick<ProgressionSettings, 'minReps' | 'maxReps' | 'deloadWeightFactor'>;

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
 * Set targets for `rowCount` rows of an exercise added or swapped in mid-session, from the
 * `SetLog`s of its reference performance (`null` or empty when none was found):
 *
 * - Working week: `targetReps` = reference reps + 1 clamped to the corridor (as rule 2),
 *   `suggestedWeight` = the reference weight as is, and a weight hint from the reference reps
 *   (rule 3).
 * - Deload week: no `targetReps` and no hint, `suggestedWeight` = reference weight ×
 *   `deloadWeightFactor` (as rule 5).
 * - No reference: neither target — the screen falls back to showing `N RIR`.
 *
 * `targetRir` is not part of this: it always comes from the current week (rule 4, or 5 for
 * deload), never from the reference.
 */
export function prescribeFromHistory(
  referenceLogs: readonly SetLog[] | null,
  rowCount: number,
  isDeload: boolean,
  settings: HistorySettings,
): SetTarget[] {
  return Array.from({ length: rowCount }, (_, index): SetTarget => {
    const setNumber = index + 1;
    const reference =
      referenceLogs === null ? undefined : referenceSetFor(referenceLogs, setNumber);
    if (reference === undefined) {
      return { setNumber };
    }
    if (isDeload) {
      return { setNumber, suggestedWeight: reference.weight * settings.deloadWeightFactor };
    }
    return {
      setNumber,
      targetReps: nextTargetReps(reference.reps, settings),
      suggestedWeight: reference.weight,
      weightHint: weightHintForReps(reference.reps, settings),
    };
  });
}
