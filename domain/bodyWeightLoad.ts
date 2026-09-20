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
//   engine progresses; the total is `bodyWeight + weight`, which is what a screen shows.
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

/** `weight` means added weight, on top of the body weight. */
export function usesAddedWeight(equipment: Equipment | undefined): boolean {
  return equipment === 'bodyweight-weighted';
}

/**
 * What the set actually loaded: the added weight on top of the body weight it was logged with,
 * or the weight as is for everything else. A `bodyweight-weighted` set with no `bodyWeight`
 * recorded can only report the added weight — see "Не уверен — не рекомендуй" (03).
 */
export function totalLoad(
  set: { weight: number; bodyWeight?: number },
  equipment: Equipment | undefined,
): number {
  return usesAddedWeight(equipment) ? set.weight + (set.bodyWeight ?? 0) : set.weight;
}
