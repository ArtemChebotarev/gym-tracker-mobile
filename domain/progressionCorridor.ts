// The rep corridor of a power exercise: the edges that raise rule 3's weight hint. See 10.2 · Power
// progression. The corridor is short (speed, not endurance) and it is a trigger for the hint, not a
// limit on the target arithmetic (17.10.2026). Power is tried in practice and these numbers may
// change, so everything that depends on them lives here and nowhere else. Strength has no such
// module: its corridor is the mesocycle's `progressionSettings`.

import type { Equipment } from '@domain/catalog';
import type { WeightHint } from '@domain/execution';
import type { ProgressionSettings } from '@domain/mesocycle';
import { hintForReps } from '@domain/progressionWeightHint';

export type RepCorridor = Pick<ProgressionSettings, 'minReps' | 'maxReps'>;

/** The lowest rep count a target falls back to after a heavier weight (10.2 P10). */
export const POWER_MIN_REPS = 2;
/** From this up the hint says to take more weight: past it the set trains endurance, not power. */
export const POWER_MAX_REPS = 6;

/**
 * A sum that came out at 0 or below is no recommendation at all (the row keeps `N RIR`: "не
 * уверен — не рекомендуй"). One rep is a target, with its hint.
 */
export function usableReps(reps: number): number | undefined {
  return reps >= 1 ? reps : undefined;
}

export const POWER_CORRIDOR: RepCorridor = { minReps: POWER_MIN_REPS, maxReps: POWER_MAX_REPS };

/** A corridor that clamps nothing: `Math.min` / `Math.max` against it return the value as is. */
export const UNBOUNDED_CORRIDOR: RepCorridor = { minReps: -Infinity, maxReps: Infinity };

/**
 * Power's only weight hint: `increase` from the top of the corridor, with nothing for a drop — a
 * lighter weight must not read as a miss (10.2 P1). None for an exercise that is its own load.
 */
export function powerWeightHint(reps: number, equipment?: Equipment): WeightHint | undefined {
  return hintForReps(reps, POWER_CORRIDOR, equipment) === 'increase' ? 'increase' : undefined;
}
