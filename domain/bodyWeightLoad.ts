// How a bodyweight exercise's load is put together — see 05 · Workout Execution & Logging
// ("Ввод веса и повторов") and 03 · Progression Engine (task 105). Its own module because the
// rules below are asked from three layers — the engine, the workout screen and history — and all
// of them start from the same question: what does this exercise's `weight` actually mean?
//
// - `bodyweight` — the load is the body weight and nothing else. `SetLog.weight` holds it.
//   There is no added weight to progress, so the engine gives such an exercise no
//   `suggestedWeight`, no weight hint and no deload weight: half your body weight is not a
//   training target. Its reps progress like any other exercise's.
// - `bodyweight-weighted` — `SetLog.weight` is the **added** weight alone, and that is what the
//   engine progresses. A screen shows the two apart — `83 (+5)`, the body weight and what was
//   hung on it — rather than their sum: what you want to read back is what you weighed and what
//   you added, and the sum hides both (Artem's review).
// - `resistance-band` — no weight at all (10.1 FR-14): the band has no weight to log or progress,
//   and the body weight does not enter either. Only its reps progress.
// - Anything else — `weight` is the weight lifted, and body weight never enters.

import type { Equipment } from '@domain/catalog';

/** Either kind of bodyweight exercise — the ones the mesocycle's body weight applies to. */
export function isBodyWeightExercise(equipment: Equipment | undefined): boolean {
  return equipment === 'bodyweight' || equipment === 'bodyweight-weighted';
}

/** The body weight is the whole load: nothing to progress on the weight axis. */
export function isPureBodyWeight(equipment: Equipment | undefined): boolean {
  return equipment === 'bodyweight';
}

/** A band exercise: it has no weight, and the body weight is not its load either. */
export function isResistanceBand(equipment: Equipment | undefined): boolean {
  return equipment === 'resistance-band';
}

/**
 * The engine sets no weight target for this exercise — no `suggestedWeight`, no weight hint, no
 * deload weight, no weight swap: its load is the body weight itself (a pure `bodyweight` one) or
 * nothing at all (a band). Its reps progress like any other exercise's.
 */
export function hasNoWeightTarget(equipment: Equipment | undefined): boolean {
  return isPureBodyWeight(equipment) || isResistanceBand(equipment);
}

/** `weight` means added weight, on top of the body weight. */
export function usesAddedWeight(equipment: Equipment | undefined): boolean {
  return equipment === 'bodyweight-weighted';
}
