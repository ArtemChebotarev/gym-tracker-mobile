// Progression engine, rule 4 — target RIR per working week. See 03 · Progression Engine,
// "Правило 4 — целевой RIR". Pure functions: RIR is fully derived from the mesocycle's
// length, the same for every set and exercise within a week, with no manual start/end RIR.

import { validateMesocycleLengthWeeks } from '@domain/mesocycleValidators';

/** Hard ceiling on the starting RIR (03 · Progression Engine, Правило 4). */
export const MAX_START_RIR = 3;

/** Number of working weeks in a block — every week except the trailing deload week. */
export function workingWeekCount(lengthWeeks: number): number {
  validateMesocycleLengthWeeks(lengthWeeks);
  return lengthWeeks - 1;
}

/** `startRir = min(3, W − 1)`, where `W` is the number of working weeks. */
export function startRir(lengthWeeks: number): number {
  return Math.min(MAX_START_RIR, workingWeekCount(lengthWeeks) - 1);
}

/**
 * `targetRir(w) = ceil(startRir × (W − w) / (W − 1))` for working week `w` (1-based). Rounding
 * up front-loads the block: more weeks stay at a high RIR, and the last working week always
 * lands on 0. Throws for the deload week — its RIR comes from `progressionSettings.deloadRir`
 * (Правило 5), not from this formula.
 */
export function targetRir(lengthWeeks: number, weekNumber: number): number {
  const workingWeeks = workingWeekCount(lengthWeeks);
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > workingWeeks) {
    throw new Error(
      `Working week must be an integer between 1 and ${workingWeeks} for a ${lengthWeeks}-week mesocycle, got ${weekNumber}.`,
    );
  }
  return Math.ceil((startRir(lengthWeeks) * (workingWeeks - weekNumber)) / (workingWeeks - 1));
}

/** The whole RIR breakdown for a block's working weeks, week 1 first (deload excluded). */
export function rirSchedule(lengthWeeks: number): number[] {
  return Array.from({ length: workingWeekCount(lengthWeeks) }, (_, index) =>
    targetRir(lengthWeeks, index + 1),
  );
}
