export type SessionPrescriptionStatus = 'awaiting_source' | 'ready';

export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'skipped';

export type SessionExerciseStatus = 'planned' | 'completed' | 'skipped';

export type WeightHint = 'decrease' | 'increase';

export type Session = {
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

export type SessionExercise = {
  id: string;
  sessionId: string;
  exerciseId: string;
  order: number;
  setTargets: SetTarget[];
  targetRir: number;
  status: SessionExerciseStatus;
};

export type SetLog = {
  id: string;
  sessionExerciseId: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number;
  completedAt: string;
};
