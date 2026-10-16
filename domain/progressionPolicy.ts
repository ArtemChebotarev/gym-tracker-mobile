// Progression policy — the contract one `Exercise.type` implements to plan its own next
// session. See 03 · Progression Engine and 10 · Hybrid Exercises, "Что меняется в спеке":
// the engine dispatches by type on top of the rules, so what a type does with them lives in
// that type's policy and not in a branch at the call site. Types only; the policies live in
// `domain/progressionPolicy<Type>.ts`, the dispatch in `domain/progressionPolicies.ts`.

import type { SetLog } from '@domain/execution';
import type { ProgressionSettings } from '@domain/mesocycle';
import type { ExercisePrescription, SourceExercise } from '@domain/progression';

/** What a policy may read besides the exercises it plans. */
export type ProgressionContext = {
  /** The source session's `SetLog`s; logs of other session exercises are ignored. */
  logs: readonly SetLog[];
  /** Week number of the session being planned (the source's week + 1). */
  weekNumber: number;
  lengthWeeks: number;
  settings: ProgressionSettings;
};

export type ProgressionPolicy = {
  /** One exercise of a working week. Rule 1 (the set count is copied) holds for every policy. */
  prescribeWorkingWeek(exercise: SourceExercise, context: ProgressionContext): ExercisePrescription;
  /**
   * The policy's own exercises of a deload day, already in their order. One prescription per
   * exercise, in the order given — the dispatcher matches them back by position. Whatever the
   * policy groups them by is decided among these alone; exercises of another type don't take part.
   */
  prescribeDeload(
    exercises: readonly SourceExercise[],
    context: ProgressionContext,
  ): ExercisePrescription[];
};
