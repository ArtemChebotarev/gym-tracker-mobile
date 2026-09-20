// Progression engine input/output shapes shared across its rules — see 03 · Progression
// Engine. Types only; the rules live in `domain/progression<Rule>.ts`.

import type { Equipment, MuscleGroup } from '@domain/catalog';
import type { SessionExercise, SetTarget } from '@domain/execution';

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
