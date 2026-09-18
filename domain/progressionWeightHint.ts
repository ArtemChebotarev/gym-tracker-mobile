// Progression engine, rule 3 — weight hint. See 03 · Progression Engine, "Правило 3 —
// рекомендации по весу". The system names only a direction, never a step size: there is no
// equipment model, and gyms differ in dumbbell/machine increments.

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
