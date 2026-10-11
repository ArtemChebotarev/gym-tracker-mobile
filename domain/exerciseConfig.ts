// What a hybrid exercise carries beyond the name and the group (10 · Hybrid Exercises, 10.1 FR-1,
// FR-2, FR-9). Types and fixed values only; the defaults and the rules live beside it in
// `exerciseConfigBuilders.ts` and `exerciseConfigValidators.ts`.
//
// A `strength` exercise has no config — what it needs is already on `Exercise` and in the plan.
// The other three each have one shape, tagged with the `type` it belongs to so a stored JSON
// document says what it is without the row next to it.

/** How a power exercise's load is expressed (FR-2). */
export const POWER_LOADS = ['weight', 'level', 'none'] as const;

/**
 * `weight` — kilograms, a medicine ball or a kettlebell. `level` — a rung of a ladder that has no
 * kilograms, like the height of a box. `none` — the exercise is its own load.
 */
export type PowerLoad = (typeof POWER_LOADS)[number];

/**
 * What a progression moves on an interval exercise (10 · Hybrid Exercises, "Interval: рычаги").
 * `output` — more repeats or metres for the same time — is the second wave and is not in the list
 * until something can log it.
 */
export const INTERVAL_LEVERS = ['rest', 'workTime', 'rounds', 'none'] as const;

export type IntervalLever = (typeof INTERVAL_LEVERS)[number];

/** The step a time lever moves by, in seconds (FR-8). `rounds` always steps by one. */
export const INTERVAL_STEPS_SEC = [5, 10, 15] as const;

export type IntervalStepSec = (typeof INTERVAL_STEPS_SEC)[number];

export type PowerConfig = {
  type: 'power';
  load: PowerLoad;
  /** Rest between sets, seconds. */
  restSec: number;
  /**
   * The user has said there is nothing heavier to take (FR-4, "No heavier available"): the hint
   * at the ceiling changes from "try heavier" to "try a harder variation".
   */
  noHeavierAvailable: boolean;
};

export type IntervalConfig = {
  type: 'interval';
  rounds: number;
  /** Work time of one round, seconds. */
  workSec: number;
  /** Rest between rounds, seconds. The same after every round. */
  restSec: number;
  /** The countdown before a round that was started by a tap, seconds (FR-6). */
  getReadySec: number;
  lever: IntervalLever;
  /** Seconds a time lever moves by. Unused while the lever is `rounds` or `none`. */
  stepSec: IntervalStepSec;
};

export type MobilityConfig = {
  type: 'mobility';
  /** Length of the one position, seconds (FR-10). */
  durationSec: number;
};

export type ExerciseConfig = PowerConfig | IntervalConfig | MobilityConfig;
