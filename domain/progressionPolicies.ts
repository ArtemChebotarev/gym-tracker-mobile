// The registry of progression policies, one per `Exercise.type`. See 03 · Progression Engine and
// 10 · Hybrid Exercises. `Record<ExerciseType, …>` makes the compiler refuse a type without a
// policy, so a new type is a new policy file plus one line here and nothing else in the engine.

import type { ExerciseType } from '@domain/catalog';
import type { SourceExercise } from '@domain/progression';
import type { ProgressionPolicy } from '@domain/progressionPolicy';
import { intervalPolicy } from '@domain/progressionPolicyInterval';
import { mobilityPolicy } from '@domain/progressionPolicyMobility';
import { powerPolicy } from '@domain/progressionPolicyPower';
import { strengthPolicy } from '@domain/progressionPolicyStrength';

/** Every type has a file of its own, and none shares anything with strength. */
export const PROGRESSION_POLICIES: Record<ExerciseType, ProgressionPolicy> = {
  strength: strengthPolicy,
  power: powerPolicy,
  interval: intervalPolicy,
  mobility: mobilityPolicy,
};

/** The policy of the exercise's type; an exercise with no `type` is `strength`. */
export function policyFor(exercise: Pick<SourceExercise, 'type'>): ProgressionPolicy {
  return PROGRESSION_POLICIES[exercise.type ?? 'strength'];
}
