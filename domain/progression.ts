// Progression engine input/output shapes shared across its rules — see 03 · Progression
// Engine. Types only; the rules live in `domain/progression<Rule>.ts`.

import type { Equipment, MuscleGroup } from '@domain/catalog';
import type { SessionExercise, SetLog, SetTarget } from '@domain/execution';

/**
 * One exercise of the source session, plus the facts about it that the session itself doesn't
 * carry. The use case layer resolves `muscleGroup` and `equipment` from the exercise catalog
 * before calling the engine — the engine never reads storage (03 · Progression Engine, "Роль
 * движка").
 */
export type SourceExercise = {
  sessionExercise: Pick<SessionExercise, 'id' | 'exerciseId' | 'order' | 'setTargets'>;
  muscleGroup: MuscleGroup;
  /**
   * Decides what the exercise's weight means, and whether it has one to progress at all — a pure
   * `bodyweight` exercise gets no weight target (task 105, `domain/bodyWeightLoad.ts`). Absent
   * for an exercise whose catalog entry names no equipment.
   */
  equipment?: Equipment;
};

/** The engine's plan for one exercise of the next session. */
export type ExercisePrescription = {
  exerciseId: string;
  order: number;
  setTargets: SetTarget[];
  targetRir: number;
};

/**
 * One performance of an exercise as the reference resolver sees it (03 · Progression Engine,
 * "Резолвер референса"; task 134.1): the sets logged in one session exercise, and where that
 * session stood in its block — which mesocycle, week and day. The resolver works out from these
 * which one, if any, targets can be built on; the repository only reads them.
 */
export type ExercisePerformance = {
  mesoId: string;
  weekNumber: number;
  dayNumber: number;
  isDeload: boolean;
  /** `SessionExercise.targetRir` the performance was planned at — Flow C re-prices by it. */
  targetRir: number;
  /** When the last of its sets was logged — orders performances in time. UTC ISO. */
  performedAt: string;
  /** Sorted by `setNumber`. A performance with none logged isn't one — see the resolver. */
  setLogs: SetLog[];
};

/** A training week: a (mesocycle, week number) pair, not a calendar week. */
export type TrainingWeek = Pick<ExercisePerformance, 'mesoId' | 'weekNumber'>;

/** Where the targets being resolved will stand. */
export type ReferenceSlot = {
  /** Rule 6: the target session's mesocycle. Flow C: the mesocycle being copied. */
  mesoId: string;
  dayNumber: number;
  /**
   * Rule 6 only: the target session's week. A performance from it is a parallel one, not a
   * previous one — it is taken only when no earlier week has any, and then only as an estimate.
   * Flow C passes none: the block being copied is its reference whatever week it ended on.
   */
  currentWeek?: TrainingWeek;
};

/**
 * Where an estimate's reference came from, which decides its arithmetic (03, "Оценка"):
 * - `earlier_week` — an earlier week of the slot's own mesocycle: + 1, as a week of progression.
 * - `other_block` — another mesocycle: + 1 and the RIR gap, as Flow C carries a block over.
 * - `current_week` — the fallback when no earlier week has any: a parallel performance, reps as
 *   they were.
 */
export type EstimateSource = 'earlier_week' | 'other_block' | 'current_week';

/**
 * What the resolver found:
 * - `target` — a reference in the exercise's own slot; targets progress from it (+1).
 * - `estimate` — numbers to go by, not a target to hit; how they're priced depends on `source`.
 * - `none` — nothing to go by; the screen shows `N RIR`.
 */
export type ReferenceResolution =
  | { kind: 'target'; reference: ExercisePerformance }
  | {
      kind: 'estimate';
      reference: ExercisePerformance;
      reason: 'other_slot';
      source: EstimateSource;
    }
  | { kind: 'none' };
