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
};

export type SessionExercise = {
  id: string;
  sessionId: string;
  exerciseId: string;
  order: number;
  setTargets: SetTarget[];
  targetRir: number;
  weightHint?: WeightHint;
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
