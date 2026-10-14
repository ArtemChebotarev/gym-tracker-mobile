// Progression engine, rule 3 — weight hint. See 03 · Progression Engine, "Правило 3 —
// рекомендации по весу". The system names only a direction, never a step size: there is no
// equipment model, and gyms differ in dumbbell/machine increments.

import { isPureBodyWeight, isResistanceBand } from '@domain/bodyWeightLoad';
import type { Equipment } from '@domain/catalog';
import type { WeightHint } from '@domain/execution';
import type { ProgressionSettings } from '@domain/mesocycle';

/**
 * Hint for one set, from that set's logged reps: `increase` at or above `maxReps` (30 by
 * default), `decrease` below `minReps` (5 by default), none inside the corridor.
 */
export function weightHintForReps(
  reps: number,
  settings: Pick<ProgressionSettings, 'minReps' | 'maxReps'>,
): WeightHint | undefined {
  if (reps >= settings.maxReps) {
    return 'increase';
  }
  if (reps < settings.minReps) {
    return 'decrease';
  }
  return undefined;
}

/**
 * The hint an exercise's set gets, by its equipment. An ordinary exercise has rule 3's. A pure
 * `bodyweight` one has none: its load is the body weight, so "go heavier" points at nothing. A
 * resistance band is the exception (10.1, FR-14): at `maxReps` it says `increase`, which the card
 * words as "tighter band or slower tempo"; it never says `decrease`, since there is no lighter
 * load to go to.
 */
export function hintForReps(
  reps: number,
  settings: Pick<ProgressionSettings, 'minReps' | 'maxReps'>,
  equipment?: Equipment,
): WeightHint | undefined {
  if (isResistanceBand(equipment)) {
    return reps >= settings.maxReps ? 'increase' : undefined;
  }
  return isPureBodyWeight(equipment) ? undefined : weightHintForReps(reps, settings);
}
