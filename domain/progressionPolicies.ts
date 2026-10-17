// The registry of progression policies, one per `Exercise.type`. See 03 · Progression Engine and
// 10 · Hybrid Exercises. `Record<ExerciseType, …>` makes the compiler refuse a type without a
// policy, so a new type is a new policy file plus one line here and nothing else in the engine.

import type { ExerciseType } from '@domain/catalog';
import type { SourceExercise } from '@domain/progression';
import type { ProgressionPolicy } from '@domain/progressionPolicy';
import { powerPolicy } from '@domain/progressionPolicyPower';
import { strengthPolicy } from '@domain/progressionPolicyStrength';

/**
 * `interval` and `mobility` have no policy of their own yet and run the strength one, as
 * they did before the engine dispatched by type — the stories that give them theirs replace the
 * entry (`power` has its own: GT-80). The strength rules aren't right for them (10 · Hybrid Exercises,
 * "Зачем"); this keeps the behaviour from changing under them in the meantime.
 */
export const PROGRESSION_POLICIES: Record<ExerciseType, ProgressionPolicy> = {
  strength: strengthPolicy,
  power: powerPolicy,
  interval: strengthPolicy,
  mobility: strengthPolicy,
};

/** The policy of the exercise's type; an exercise with no `type` is `strength`. */
export function policyFor(exercise: Pick<SourceExercise, 'type'>): ProgressionPolicy {
  return PROGRESSION_POLICIES[exercise.type ?? 'strength'];
}
