import type { Timestamps } from './timestamps';

export type SessionPrescriptionStatus = 'awaiting_source' | 'ready';

/**
 * `skipped` is only ever the user's own call — Skip workout, or a session whose every exercise was
 * skipped. `abandoned` is what Stop mesocycle leaves on a session nobody got to: closed by the
 * block ending, not by a decision about that day (task 136). Both are final; they differ in who
 * made them so, which is what history has to tell apart.
 */
export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'skipped' | 'abandoned';

/** `skipped` and `abandoned` split the same way as on `SessionStatus` (task 136). */
export type SessionExerciseStatus = 'planned' | 'completed' | 'skipped' | 'abandoned';

export type WeightHint = 'decrease' | 'increase';

export type Session = Timestamps & {
  id: string;
  mesoId: string;
  weekNumber: number;
  dayNumber: number;
  name?: string;
  isDeload: boolean;
  prescriptionStatus: SessionPrescriptionStatus;
  status: SessionStatus;
  sourceSessionId?: string;
  plannedDate?: string;
  startedAt?: string;
  completedAt?: string;
};

export type SetTarget = {
  setNumber: number;
  targetReps?: number;
  suggestedWeight?: number;
  /**
   * Per-set weight hint (03 · Progression Engine, Правило 3): each set carries its own hint,
   * derived from that set's fact in the source session, so a later version can suggest a
   * concrete weight and reps per set rather than only a direction.
   */
  weightHint?: WeightHint;
};

export type SessionExercise = Timestamps & {
  id: string;
  sessionId: string;
  exerciseId: string;
  order: number;
  setTargets: SetTarget[];
  targetRir: number;
  status: SessionExerciseStatus;
};

export type SetLog = Timestamps & {
  id: string;
  sessionExerciseId: string;
  exerciseId: string;
  setNumber: number;
  /**
   * For an ordinary exercise, the weight lifted. For `bodyweight-weighted`, the **added** weight
   * only — the total is `bodyWeight + weight` (task 105), and it's the added weight the engine
   * progresses. A pure `bodyweight` set logs the body weight itself here: that is its whole load.
   */
  weight: number;
  /**
   * The body weight this set was logged with, on a `bodyweight-weighted` exercise (task 105).
   * Stored rather than read from the mesocycle so a later change of body weight doesn't restate
   * what was already done — history is immutable (05, "Сохранение данных").
   */
  bodyWeight?: number;
  reps: number;
  rir?: number;
  completedAt: string;
};

/**
 * Hit/over/under marker shown after a set is logged (03 · Progression Engine, "Индикатор
 * попадания в цель"; rendered as `✓` / `+N` / `−N` on 08.7). Purely visual: never stored and
 * never fed into any calculation. `diff` is the absolute rep difference from `targetReps`.
 */
export type TargetIndicator =
  { kind: 'hit' } | { kind: 'over'; diff: number } | { kind: 'under'; diff: number };
