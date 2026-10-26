// Progression policy — the contract one `Exercise.type` implements to plan its own sets. See 03 ·
// Progression Engine and 10 · Hybrid Exercises, "Что меняется в спеке": the engine dispatches by
// type on top of the rules, so what a type does with them lives in that type's policy and not in a
// branch at the call site. A policy reads what it needs from the exercise's settings in its cycle,
// and plans four things: the next working week, a deload day, the
// targets of an exercise with no source session (rule 6) and the first targets of a copied block
// (Flow C). Types only; the policies live in `domain/progressionPolicy<Type>.ts`, the dispatch in
// `domain/progressionPolicies.ts`.

import type { Equipment } from '@domain/catalog';
import type { RoundLog, SetLog, SetTarget } from '@domain/execution';
import type { ExerciseSettings } from '@domain/exerciseConfig';
import type { ProgressionSettings } from '@domain/mesocycle';
import type {
  ExercisePrescription,
  ReferenceResolution,
  SourceExercise,
} from '@domain/progression';

/** What a policy may read besides the exercises it plans. */
export type ProgressionContext = {
  /** The source session's `SetLog`s; logs of other session exercises are ignored. */
  logs: readonly SetLog[];
  /** The source session's `RoundLog`s — an interval's fact; logs of other exercises are ignored. */
  roundLogs: readonly RoundLog[];
  /** Week number of the session being planned (the source's week + 1). */
  weekNumber: number;
  lengthWeeks: number;
  settings: ProgressionSettings;
};

/**
 * What the reference resolver found for a slot (`resolveReference`) and the rest a policy needs to
 * price rows from it: how many rows to fill and the block's settings. `equipment` decides what the
 * exercise's weight means (task 105).
 */
export type ReferenceTargetsInput = {
  resolution: ReferenceResolution;
  rowCount: number;
  settings: ProgressionSettings;
  equipment?: Equipment;
};

/** The facts a type's policy reads off its exercise, beyond those every exercise carries. */
export type TypeSourceFacts = Pick<SourceExercise, 'powerLoad' | 'intervalProgression'>;

export type ProgressionPolicy = {
  /**
   * What the policy needs to know of the exercise from its settings in the cycle (the cycle's
   * copy, or the library's values where it has none; `undefined` for a strength exercise). The use
   * case puts it on the exercise's `SourceExercise` before planning.
   */
  sourceFacts(settings: ExerciseSettings | undefined): TypeSourceFacts;
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
  /**
   * Rule 6: `rowCount` rows (numbered from 1) for an exercise added or swapped in mid-session, from
   * what the reference resolver found. `weekRir` is the target RIR of the week the rows are for.
   */
  prescribeFromReference(input: ReferenceTargetsInput & { weekRir: number }): SetTarget[];
  /**
   * Flow C: week 1's rows of a copied block, from what the reference resolver found for the day.
   * `startRir` is the new block's starting RIR.
   */
  prescribeBlockStart(input: ReferenceTargetsInput & { startRir: number }): SetTarget[];
};
