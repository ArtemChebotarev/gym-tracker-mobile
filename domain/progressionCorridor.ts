// The rep corridor a type progresses in, and whether it gets weight hints. See 10.2 · Power
// progression, P1: power trains speed, not endurance, so its corridor is short and its ceiling
// is hard — it never grows. Progression of power is tried in practice and these numbers may
// change, so everything that depends on them lives here and nowhere else.

import type { ExerciseType } from '@domain/catalog';
import type { ProgressionSettings } from '@domain/mesocycle';

export type RepCorridor = Pick<ProgressionSettings, 'minReps' | 'maxReps'>;

/** After a weight increase the fact drops and the target falls back to this (P1, P10). */
export const POWER_MIN_REPS = 2;
/** Past this the set trains endurance, not power; the target holds here (P3). */
export const POWER_MAX_REPS = 6;

export const POWER_CORRIDOR: RepCorridor = { minReps: POWER_MIN_REPS, maxReps: POWER_MAX_REPS };

/** `power` has a corridor of its own; every other type uses the mesocycle's settings. */
export function corridorFor(type: ExerciseType | undefined, settings: RepCorridor): RepCorridor {
  return type === 'power' ? POWER_CORRIDOR : settings;
}

/**
 * Rule 3's "go heavier / go lighter" hint. A power exercise has none: nothing punishes a
 * drop, and the only prompt is the ceiling one (GT-81), which the screen derives from targets.
 */
export function givesWeightHint(type: ExerciseType | undefined): boolean {
  return type !== 'power';
}
