// What a hybrid exercise carries beyond the name and the group (10 · Hybrid Exercises, 10.1 FR-1,
// FR-2, FR-9). Types and fixed values only; the defaults and the rules live beside it in
// `exerciseConfigBuilders.ts` and `exerciseConfigValidators.ts`.
//
// A `strength` exercise has no config — what it needs is already on `Exercise` and in the plan.
// The other three each have one shape, tagged with the `type` it belongs to so a stored JSON
// document says what it is without the row next to it.
//
// The rest between a power exercise's sets and an interval's Get ready are not here: they are
// settings, the same for every exercise (GT-188). A config stored before that still carries
// `restSec` / `getReadySec`; nothing reads them.

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

/**
 * The step a time lever moves by, in seconds (FR-8). `rounds` always steps by one. A lever's only
 * bound is the rest's floor, `INTERVAL_REST_MIN_SEC`: work and rounds have no ceiling (GT-101,
 * Artem, 26.10.2026).
 */
export const INTERVAL_STEPS_SEC = [5, 10, 15] as const;

export type IntervalStepSec = (typeof INTERVAL_STEPS_SEC)[number];

/**
 * The seconds a time field of a config is set in steps of — and the rest between sets in Settings
 * (`REST_BETWEEN_SETS_RANGE_SEC`). Get ready, a setting too, is set by the second.
 */
export const CONFIG_TIME_STEP_SEC = 5;

/** The time fields of a config, by the key they are stored under. */
export type ConfigTimeKey = 'restSec' | 'workSec' | 'durationSec';

/**
 * What each time field may hold, seconds — the same range wherever it is set: the New/Edit
 * exercise page, the cycle editor's plan sheet (GT-92).
 */
export const CONFIG_TIME_RANGE_SEC: Record<ConfigTimeKey, { min: number; max: number }> = {
  restSec: { min: 0, max: 10 * 60 },
  workSec: { min: CONFIG_TIME_STEP_SEC, max: 60 * 60 },
  durationSec: { min: 60, max: 60 * 60 },
};

/**
 * The least rest between the rounds of an interval (GT-176, Artem, 26.10.2026): 10 s, Tabata's
 * 20/10. A rest of 0 would run the rounds into one, and with Get ready at most 10 s — the rest's
 * last seconds — a rest is never shorter than its Get ready. The rest lever (FR-8) does not take a
 * rest below it either.
 */
export const INTERVAL_REST_MIN_SEC = 10;

export type PowerConfig = {
  type: 'power';
  load: PowerLoad;
  /**
   * The user has said there is nothing heavier to take (FR-4, "No heavier available"): the hint
   * at the ceiling changes from "try heavier" to "try a harder variation".
   */
  noHeavierAvailable: boolean;
  /**
   * The user closed the note at the top of the corridor for good (GT-81). Only the note goes: the
   * targets and the hints on the sets stay. Absent means shown; there is no way back yet.
   */
  ceilingTipHidden?: boolean;
};

export type IntervalConfig = {
  type: 'interval';
  /** Work time of one round, seconds. */
  workSec: number;
  /** Rest between rounds, seconds. The same after every round. */
  restSec: number;
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

/**
 * An interval exercise's config as a cycle holds it: the library's values plus how many rounds
 * the cycle does. The count is not a property of the exercise — as sets are not for a strength
 * one — so it exists only here, set when the cycle is created (FR-9).
 */
export type IntervalPlanConfig = IntervalConfig & { rounds: number };

/** What a cycle keeps per hybrid exercise (`Mesocycle.exerciseSettings`). */
export type ExerciseSettings = PowerConfig | IntervalPlanConfig | MobilityConfig;
