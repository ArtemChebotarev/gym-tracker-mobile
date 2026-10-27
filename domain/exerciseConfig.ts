// What a hybrid exercise carries beyond the name and the group (10 · Hybrid Exercises, 10.1 FR-1,
// FR-2, FR-9). Types and fixed values only; the defaults and the rules live beside it in
// `exerciseConfigBuilders.ts` and `exerciseConfigValidators.ts`.
//
// A `strength` exercise has no config — what it needs is already on `Exercise` and in the plan.
// The other three each have one shape, tagged with the `type` it belongs to so a stored JSON
// document says what it is without the row next to it.
//
// No time is here (10.1 FR-9, Artem, 26.10.2026). The rest between a power exercise's sets and an
// interval's Get ready are settings, the same for every exercise (GT-188); an interval's work and
// rest and a mobility exercise's length come from history and are picked on the card the first
// time, as a weight is (GT-187, GT-185, GT-191). A config stored before that still carries
// `restSec` / `getReadySec` / `workSec` / `durationSec`; nothing reads them.

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
 * The seconds a time is picked in steps of: a round's work and rest on the card (`ROUND_TIME_BOUNDS`)
 * and the rest between sets in Settings (`REST_BETWEEN_SETS_RANGE_SEC`). Get ready goes by the
 * second.
 */
export const TIME_STEP_SEC = 5;

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
  lever: IntervalLever;
  /** Seconds a time lever moves by. Unused while the lever is `rounds` or `none`. */
  stepSec: IntervalStepSec;
};

/** A mobility exercise has nothing to set: its length comes from history (FR-9, FR-10). */
export type MobilityConfig = {
  type: 'mobility';
};

export type ExerciseConfig = PowerConfig | IntervalConfig | MobilityConfig;

/**
 * What a cycle keeps per hybrid exercise (`Mesocycle.exerciseSettings`): a copy of the library's
 * config, taken when the exercise joins the cycle and never edited in it (10.1 FR-8, Artem,
 * 27.10.2026) — the cycle lives by it, so an edit in the library reaches new cycles only. How many
 * rounds an interval does is the day's, as sets are (`WeekPlanExercise.sets`, GT-190); a copy
 * stored before still carries `rounds`, and nothing reads it.
 */
export type ExerciseSettings = ExerciseConfig;
