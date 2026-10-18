// The registry of progression policies, one per `Exercise.type`. See 03 · Progression Engine and
// 10 · Hybrid Exercises. `Record<ExerciseType, …>` makes the compiler refuse a type without a
// policy, so a new type is a new policy file plus one line here and nothing else in the engine.

import type { ExerciseType } from '@domain/catalog';
import type { SourceExercise } from '@domain/progression';
import type { ProgressionPolicy } from '@domain/progressionPolicy';
import { intervalPolicy } from '@domain/progressionPolicyInterval';
import { powerPolicy } from '@domain/progressionPolicyPower';
import { strengthPolicy } from '@domain/progressionPolicyStrength';

/**
 * `power` and `interval` each have a file of their own (`interval` still delegates to strength's
 * until GT-100). `mobility` has none yet and runs the strength policy, as every non-strength type
 * did before the engine dispatched by type; the strength rules aren't right for it (10 · Hybrid
 * Exercises, "Зачем"), and this keeps the behaviour from changing under it until its story gives
 * it one.
 */
export const PROGRESSION_POLICIES: Record<ExerciseType, ProgressionPolicy> = {
  strength: strengthPolicy,
  power: powerPolicy,
  interval: intervalPolicy,
  mobility: strengthPolicy,
};

/** The policy of the exercise's type; an exercise with no `type` is `strength`. */
export function policyFor(exercise: Pick<SourceExercise, 'type'>): ProgressionPolicy {
  return PROGRESSION_POLICIES[exercise.type ?? 'strength'];
}
