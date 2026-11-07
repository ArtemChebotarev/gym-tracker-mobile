// The rule for `WorkoutKind` (GT-247). Pure: the use case layer reads which exercises were done and
// what type each is, and hands the types here.

import type { ExerciseType } from './catalog';
import type { WorkoutKind } from './workoutKind';

/**
 * `hybrid` when any of `types` is not `strength`, otherwise `strength` — also for no types at all:
 * a day with nothing hybrid done in it was not a hybrid one.
 */
export function workoutKindOf(types: readonly ExerciseType[]): WorkoutKind {
  return types.some((type) => type !== 'strength') ? 'hybrid' : 'strength';
}
