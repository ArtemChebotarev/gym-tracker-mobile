// Weight swap concepts — 03 · Progression Engine, "Правило 7 — другой вес внутри тренировки"
// (task 120). Types only; the rules that build and read them live in `domain/weightSwapRules.ts`.
//
// Rules 2 and 6 issue a target as a pair — `suggestedWeight` × `targetReps`. When that weight
// isn't in the gym you're standing in, the pair falls apart: the reps were only ever the right
// answer for that weight. Rule 7 keeps the target by moving the reps to the weight you do have.
//
// None of this is stored, and none of it is the engine's next-week plan: it is a reading of a
// target already issued, so it is computed on the client and never enters a server response.

import type { ProgressionSettings } from '@domain/mesocycle';

/**
 * A span of weights, in kg, both ends usable. Bounds are rounded to halves of a kilo *inward*, so
 * a weight sitting exactly on one still has a rep target: 3.89 becomes 4, 17.78 becomes 17.5.
 */
export type WeightRange = { min: number; max: number };

/**
 * How far the weight in hand is from the one the target was issued for:
 * - `target` — the same weight; the target stands as it is.
 * - `close` — within 20% of it, and the recomputed reps are inside the rep corridor. The number
 *   is treated as a target of its own.
 * - `estimate` — further than 20%. Brzycki drifts with distance, so the number is a guide.
 * - `out` — the recomputed reps fall outside the corridor. There is no target at that weight.
 */
export type WeightSwapZone = 'target' | 'close' | 'estimate' | 'out';

/** Which end of the rep corridor a weight falls off. */
export type WeightSwapDirection = 'tooHeavy' | 'tooLight';

/** The set has a target to move, and this is everything needed to move it. */
export type WeightSwapTarget = {
  /**
   * W — the weight the target was issued for, as the formula sees the load. On a
   * `bodyweight-weighted` exercise that is the whole load, body weight included; every other
   * weight here (`closeRange`, `estimateRange`, what `evaluateWeightSwap` is asked about) is the
   * **added** weight, the same number the set row types in.
   */
  baseWeight: number;
  /** R — the reps targeted at `baseWeight`. */
  baseReps: number;
  /**
   * `bodyweight-weighted` only: the body weight an added weight sits on top of, which is what
   * tells the two apart from `baseWeight` (task 105). Absent on every other exercise, where the
   * weight entered *is* the load.
   */
  bodyWeight?: number;
  /** The corridor a recomputed rep count has to land in to be a target at all. */
  corridor: Pick<ProgressionSettings, 'minReps' | 'maxReps'>;
  /** Weights within 20% of the base that still land inside the corridor. */
  closeRange: WeightRange;
  /** Every weight that lands inside the corridor, however far from the base. */
  estimateRange: WeightRange;
};

/**
 * There is a set to do but no target to move onto another weight — week 1 of Flow A/B, no
 * reference performance under rule 6, incomplete data. The screen says why there are no numbers
 * rather than leaving the question open ("Не уверен — не рекомендуй").
 */
export type WeightSwapUnavailable = { unavailable: 'no_history' };

export type WeightSwap = WeightSwapTarget | WeightSwapUnavailable;

/**
 * What one weight is worth: the reps to aim for, or — off the corridor — which way it went and
 * the weight up to which a target still exists.
 */
export type WeightSwapEvaluation =
  | { zone: Exclude<WeightSwapZone, 'out'>; reps: number }
  | { zone: 'out'; direction: WeightSwapDirection; bound: number };
