// The rep corridor of a type: the edges that raise rule 3's weight hint. See 10.2 · Power
// progression. For power the corridor is short (speed, not endurance) and it is a trigger for the
// hint, not a limit on the target arithmetic (17.10.2026). Power is tried in practice and these
// numbers may change, so everything that depends on them lives here and nowhere else.

import type { ExerciseType } from '@domain/catalog';
import type { ProgressionSettings } from '@domain/mesocycle';

export type RepCorridor = Pick<ProgressionSettings, 'minReps' | 'maxReps'>;

/** Below this the hint says to take less weight. */
export const POWER_MIN_REPS = 2;
/** From this up the hint says to take more weight: past it the set trains endurance, not power. */
export const POWER_MAX_REPS = 6;

export const POWER_CORRIDOR: RepCorridor = { minReps: POWER_MIN_REPS, maxReps: POWER_MAX_REPS };

/** A corridor that clamps nothing: `Math.min` / `Math.max` against it return the value as is. */
const UNBOUNDED: RepCorridor = { minReps: -Infinity, maxReps: Infinity };

/**
 * What the target arithmetic clamps to. For `power` it is nothing: the corridor is the trigger of
 * a hint, not a limit on the sum (17.10.2026) — a fact of 7 gives a target of 8. Every other type
 * still clamps to the mesocycle's settings; that is a known bug (see the bug "Коридор повторов —
 * триггер подсказки"), not the rule.
 */
export function clampFor(type: ExerciseType | undefined, settings: RepCorridor): RepCorridor {
  return type === 'power' ? UNBOUNDED : settings;
}

/** The corridor whose edges raise rule 3's hint: `power` has its own, the rest the settings'. */
export function hintCorridorFor(
  type: ExerciseType | undefined,
  settings: RepCorridor,
): RepCorridor {
  return type === 'power' ? POWER_CORRIDOR : settings;
}

/**
 * A sum that came out at 0 or below is no recommendation at all (the row keeps `N RIR`: "не
 * уверен — не рекомендуй"). One rep is a target, with its hint.
 */
export function usableReps(reps: number): number | undefined {
  return reps >= 1 ? reps : undefined;
}
