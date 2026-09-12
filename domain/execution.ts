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

/**
 * Throws if two sessions in `sessions` share the same `(mesoId, weekNumber,
 * dayNumber)` triple (02 · Domain Model, "Session", invariants: "Пара
 * (mesoId, weekNumber, dayNumber) уникальна").
 */
export function validateUniqueSessionSlots(sessions: readonly Session[]): void {
  const seen = new Set<string>();
  for (const session of sessions) {
    const key = `${session.mesoId}:${session.weekNumber}:${session.dayNumber}`;
    if (seen.has(key)) {
      throw new Error(
        `Duplicate session for mesoId "${session.mesoId}", week ${session.weekNumber}, day ${session.dayNumber}.`,
      );
    }
    seen.add(key);
  }
}

/**
 * Throws if more than one of `sessions` has `status: 'in_progress'` (02 ·
 * Domain Model, "Session", invariants: "Только одна сессия может быть
 * in_progress во всём приложении"). Callers validate the resulting collection
 * across the whole app, not just within one mesocycle.
 */
export function validateSingleInProgressSession(sessions: readonly Session[]): void {
  const inProgressCount = sessions.filter((session) => session.status === 'in_progress').length;
  if (inProgressCount > 1) {
    throw new Error(`Only one session may be in_progress at a time, found ${inProgressCount}.`);
  }
}

/**
 * Throws if `session` is `awaiting_source` and either carries session exercises
 * or is being started (02 · Domain Model, "Session", invariants: "Сессия в
 * awaiting_source не имеет SessionExercise"; 03 · Progression Engine,
 * "Ленивая генерация по дням": `awaiting_source` is a wait state, not a
 * startable one).
 */
export function validateAwaitingSourceSession(
  session: Session,
  exercises: readonly SessionExercise[],
): void {
  if (session.prescriptionStatus !== 'awaiting_source') {
    return;
  }
  if (exercises.length > 0) {
    throw new Error(
      `Session "${session.id}" is awaiting_source and must not have session exercises, found ${exercises.length}.`,
    );
  }
  if (session.status === 'in_progress') {
    throw new Error(`Session "${session.id}" is awaiting_source and cannot be started.`);
  }
}
