// What a power card says once every set is at the top of the corridor — 10.2 · Power progression,
// P6–P9, as settled on 17.10.2026. Saturation is the facts of all sets reaching the top, which the
// engine already wrote onto the targets as `weightHint = increase` (`powerWeightHint`); nothing is
// stored, so the hint is simply there each week while it holds. What it offers depends on what the
// exercise's load is: kilograms ask for a heavier weight, a level for a higher one, and an exercise
// that is its own load has only one more set. Past the set cap (4) the progression may simply stop.

import type { SetTarget } from '@domain/execution';
import type { PowerLoad } from '@domain/exerciseConfig';

/** Power's cap on the number of sets (P8): past it, only the load can still go up. */
export const POWER_MAX_SETS = 4;

/**
 * One thing the user may do about it. `heavier` and `higher-level` are the load going up
 * (kilograms / a level); `harder-variation` takes their place once the user said there is nothing
 * heavier to take (P9); `add-set` is the volume going up.
 */
export type CeilingOption = 'heavier' | 'higher-level' | 'harder-variation' | 'add-set';

export type PowerCeilingHint = {
  /** In the order they are offered, never empty. */
  options: CeilingOption[];
  /**
   * The load option can be dismissed with "No heavier available" — offered while that option is
   * `heavier` or `higher-level`, which is also the only time it means anything.
   */
  canFlagNoHeavier: boolean;
};

export type PowerCeilingInput = {
  load: PowerLoad;
  /** The user said there is nothing heavier to take (`PowerConfig.noHeavierAvailable`). */
  noHeavierAvailable: boolean;
  setTargets: readonly Pick<SetTarget, 'weightHint'>[];
};

/**
 * The hint for the card, or `undefined` while there is nothing to say: not every set is at the top
 * yet (while any still grows there is no saturation, P6), or the exercise is at the set cap and
 * has no load to raise — its progression has nowhere to go and that is fine.
 */
export function powerCeilingHint(input: PowerCeilingInput): PowerCeilingHint | undefined {
  const { load, noHeavierAvailable, setTargets } = input;
  if (setTargets.length === 0 || !setTargets.every((target) => target.weightHint === 'increase')) {
    return undefined;
  }
  const options: CeilingOption[] = [];
  if (load === 'weight') {
    options.push(noHeavierAvailable ? 'harder-variation' : 'heavier');
  } else if (load === 'level') {
    options.push(noHeavierAvailable ? 'harder-variation' : 'higher-level');
  }
  if (setTargets.length < POWER_MAX_SETS) {
    options.push('add-set');
  }
  if (options.length === 0) {
    return undefined;
  }
  return {
    options,
    canFlagNoHeavier: options[0] === 'heavier' || options[0] === 'higher-level',
  };
}
