// Materializing the next week's session — see 03 · Progression Engine, "Ленивая генерация по
// дням": finishing or skipping week W, day D creates week W + 1, day D. The engine
// (`prescribeNextSession`) plans the exercises; this turns that plan into `Session` /
// `SessionExercise` records with fresh ids. Pure apart from id generation.

import type { Session, SessionExercise } from '@domain/execution';
import { generateId } from '@domain/id';
import type { ExercisePrescription } from '@domain/progression';
import { isDeloadWeek } from '@domain/progressionPlan';
import type { Unsaved } from '@domain/timestamps';

/**
 * The week the session after `trigger` belongs to, or `null` when there is none: a deload session
 * is always the block's last week (02 · Domain Model, "Mesocycle"), so finishing it generates
 * nothing (05, "Deload-неделя").
 */
export function nextWeekNumber(
  trigger: Pick<Session, 'weekNumber' | 'isDeload'>,
  lengthWeeks: number,
): number | null {
  if (trigger.isDeload || trigger.weekNumber >= lengthWeeks) {
    return null;
  }
  return trigger.weekNumber + 1;
}

export type NextSessionInput = {
  /** The session whose Finish or Skip triggers generation (week W, day D). */
  trigger: Pick<Session, 'mesoId' | 'dayNumber' | 'name'>;
  /** The session the plan was computed from — `trigger` itself, or an earlier one after a skip. */
  base: Pick<Session, 'id'>;
  weekNumber: number;
  lengthWeeks: number;
  prescriptions: readonly ExercisePrescription[];
};

export type NextSessionDraft = {
  session: Unsaved<Session>;
  sessionExercises: Unsaved<SessionExercise>[];
};

/**
 * Week `weekNumber`, day D as a ready, `planned` session carrying the day's name, whether it's the
 * deload week, and `sourceSessionId` pointing at the base it was planned from — plus one
 * `planned` session exercise per prescription.
 */
export function buildNextSession(input: NextSessionInput): NextSessionDraft {
  const { trigger, base, weekNumber, lengthWeeks, prescriptions } = input;
  const session: Unsaved<Session> = {
    id: generateId(),
    mesoId: trigger.mesoId,
    weekNumber,
    dayNumber: trigger.dayNumber,
    isDeload: isDeloadWeek(lengthWeeks, weekNumber),
    prescriptionStatus: 'ready',
    status: 'planned',
    sourceSessionId: base.id,
  };
  if (trigger.name !== undefined) {
    session.name = trigger.name;
  }
  const sessionExercises = prescriptions.map((prescription): Unsaved<SessionExercise> => ({
    id: generateId(),
    sessionId: session.id,
    exerciseId: prescription.exerciseId,
    order: prescription.order,
    setTargets: prescription.setTargets,
    targetRir: prescription.targetRir,
    status: 'planned',
  }));
  return { session, sessionExercises };
}
