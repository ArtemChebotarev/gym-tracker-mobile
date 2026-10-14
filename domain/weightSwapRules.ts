// Progression engine, rule 7 — the reps a set is worth at another weight. See 03 · Progression
// Engine, "Правило 7 — другой вес внутри тренировки" (task 120). Pure functions over the target
// already issued for the set: they read no storage, no clock, and nothing they return is stored.
//
// Its own module rather than another `progression<Rule>.ts` because it is not part of generating
// next week's plan: rules 1–6 need history and will move to a backend one day, while this one is
// a reading of a target already in hand and stays on the client (03, "Где считается").

import { isPureBodyWeight, usesAddedWeight } from '@domain/bodyWeightLoad';
import type { Equipment } from '@domain/catalog';
import type { SetTarget } from '@domain/execution';
import type { ProgressionSettings } from '@domain/mesocycle';
import type {
  WeightRange,
  WeightSwap,
  WeightSwapEvaluation,
  WeightSwapTarget,
} from '@domain/weightSwap';

type RepCorridor = Pick<ProgressionSettings, 'minReps' | 'maxReps'>;

/**
 * Brzycki's constant: `e1RM = W × 36 / (37 − R)`, which rearranges to
 * `R2 = 37 − (37 − R) × W2 / W` — reps move linearly with the weight. Epley was rejected for
 * running away at high reps (a 5 kg × 25 target reads as 39 reps at 4 kg).
 */
const BRZYCKI = 37;

/**
 * How far from the base weight the recomputed reps are still treated as a target rather than a
 * guide. An engine constant, not a `progressionSettings` field — nothing in the UI changes it.
 */
const CLOSE_THRESHOLD = 0.2;

/** Range bounds land on halves of a kilo — the smallest plate anyone actually has. */
const WEIGHT_STEP = 0.5;

/**
 * Slack for the 20% comparison. `84 / 70 - 1` is `0.20000000000000018` in binary floating point,
 * and a weight exactly 20% away belongs in `close`.
 */
const THRESHOLD_SLACK = 1e-9;

/**
 * Binary floating point off a value that is a round number in decimal: `27 * (17.5 / 15)` comes
 * out as `31.500000000000004`, which would round the reps below the half instead of above it, and
 * `70 * 0.8` as `56.00000000000001`, which would floor to a lighter half kilo. Dropping the noise
 * keeps both on the number the formula actually gives.
 */
function withoutFloatNoise(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}

/** Reps at `load`, rounded to the nearest whole one — R2 of the formula above. */
function repsAt(baseWeight: number, baseReps: number, load: number): number {
  return Math.round(withoutFloatNoise(BRZYCKI - (BRZYCKI - baseReps) * (load / baseWeight)));
}

/** The load that works out to exactly `reps` — the formula solved the other way round. */
function loadFor(baseWeight: number, baseReps: number, reps: number): number {
  return (baseWeight * (BRZYCKI - reps)) / (BRZYCKI - baseReps);
}

/**
 * A bound moved onto a half kilo, `up` for the light end and `down` for the heavy one — always
 * inward, so the bound itself is a weight the corridor still answers for.
 */
function snap(weight: number, direction: 'up' | 'down'): number {
  const steps = withoutFloatNoise(weight / WEIGHT_STEP);
  return (direction === 'up' ? Math.ceil(steps) : Math.floor(steps)) * WEIGHT_STEP;
}

/**
 * A span of loads as the set row states weights: minus the body weight on a `bodyweight-weighted`
 * exercise, and never below +0 — there is no assisted variant to go lighter with.
 */
function toRange(min: number, max: number, bodyWeight: number): WeightRange {
  return {
    min: snap(Math.max(min - bodyWeight, 0), 'up'),
    max: snap(Math.max(max - bodyWeight, 0), 'down'),
  };
}

/** What `buildWeightSwap` needs about the set and the block it sits in. */
export type WeightSwapInput = {
  /** The set's own target — the pair rule 7 moves onto another weight. */
  target: Pick<SetTarget, 'targetReps' | 'suggestedWeight'>;
  settings: RepCorridor;
  /** The session's deload flag: rule 7 doesn't apply there at all. */
  isDeload: boolean;
  /** Decides what the set's weight means — see `domain/bodyWeightLoad.ts` (task 105). */
  equipment?: Equipment;
  /** The block's body weight (task 105). Only a `bodyweight-weighted` exercise needs it. */
  bodyWeight?: number;
};

/**
 * What this set's target becomes at other weights, or nothing when the question doesn't arise:
 *
 * - **Absent** — a deload set (its weight is a fraction of a working one, and the week isn't for
 *   progression), a pure `bodyweight` set (there is no weight to change), and a
 *   `bodyweight-weighted` set while the block has no body weight yet: without it there is no load
 *   to compute from, and the screen asks for it before anything can be typed into the set anyway.
 * - **`unavailable: 'no_history'`** — the set has a weight or reps missing, or a pair that
 *   doesn't add up. There is a weight to pick and nothing to derive from it.
 * - **A target** — the base pair, the rep corridor, and the two weight spans the screen shows.
 */
export function buildWeightSwap({
  target,
  settings,
  isDeload,
  equipment,
  bodyWeight,
}: WeightSwapInput): WeightSwap | undefined {
  if (isDeload || isPureBodyWeight(equipment)) {
    return undefined;
  }
  const addedWeight = usesAddedWeight(equipment);
  if (addedWeight && bodyWeight === undefined) {
    return undefined;
  }
  const { targetReps, suggestedWeight } = target;
  if (targetReps === undefined || suggestedWeight === undefined) {
    return { unavailable: 'no_history' };
  }
  // On a weighted bodyweight exercise the whole body is what goes up, so every 1RM estimate for
  // one counts the body weight in: the base is the full load, and the spans come back as added
  // weight. `maxReps` past the formula's own limit would turn the spans inside out.
  const base = addedWeight ? (bodyWeight ?? 0) + suggestedWeight : suggestedWeight;
  if (
    base <= 0 ||
    settings.maxReps >= BRZYCKI ||
    targetReps < settings.minReps ||
    targetReps > settings.maxReps
  ) {
    return { unavailable: 'no_history' };
  }

  const offset = addedWeight ? (bodyWeight ?? 0) : 0;
  // The corridor read as weights: the lightest load still worth `maxReps`, the heaviest still
  // worth `minReps`. Zones are judged by the weight, because the formula's error grows with the
  // distance from the base, not with the rep count.
  const lightest = loadFor(base, targetReps, settings.maxReps);
  const heaviest = loadFor(base, targetReps, settings.minReps);
  const swap: WeightSwapTarget = {
    baseWeight: base,
    baseReps: targetReps,
    corridor: { minReps: settings.minReps, maxReps: settings.maxReps },
    closeRange: toRange(
      Math.max(base * (1 - CLOSE_THRESHOLD), lightest),
      Math.min(base * (1 + CLOSE_THRESHOLD), heaviest),
      offset,
    ),
    estimateRange: toRange(lightest, heaviest, offset),
  };
  if (addedWeight && bodyWeight !== undefined) {
    swap.bodyWeight = bodyWeight;
  }
  return swap;
}

/**
 * What `weight` is worth against this set's target. `weight` is what the set row holds — the
 * added weight on a `bodyweight-weighted` exercise, the weight lifted on every other one.
 *
 * `bodyWeight` overrides the block's own, for a set already logged: it goes with its own body
 * weight (task 105), so a later change of the block's doesn't restate what was done.
 *
 * `undefined` when there is nothing to compare against — no swap, no target behind it, or no
 * weight yet (an empty field, a zero, a load that cancels out).
 */
export function evaluateWeightSwap(
  swap: WeightSwap | undefined,
  weight: number,
  bodyWeight?: number,
): WeightSwapEvaluation | undefined {
  if (swap === undefined || 'unavailable' in swap) {
    return undefined;
  }
  const load = weight + (swap.bodyWeight === undefined ? 0 : (bodyWeight ?? swap.bodyWeight));
  if (load <= 0) {
    return undefined;
  }
  const reps = repsAt(swap.baseWeight, swap.baseReps, load);
  if (reps < swap.corridor.minReps) {
    return { zone: 'out', direction: 'tooHeavy', bound: swap.estimateRange.max };
  }
  if (reps > swap.corridor.maxReps) {
    return { zone: 'out', direction: 'tooLight', bound: swap.estimateRange.min };
  }
  if (load === swap.baseWeight) {
    return { zone: 'target', reps: swap.baseReps };
  }
  const deviation = Math.abs(load / swap.baseWeight - 1);
  return {
    zone: deviation <= CLOSE_THRESHOLD + THRESHOLD_SLACK ? 'close' : 'estimate',
    reps,
  };
}
