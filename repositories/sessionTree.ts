import type { Exercise } from '@domain/catalog';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import type { Mesocycle } from '@domain/mesocycle';

/** One exercise of a session with the catalog record it refers to and its set logs. */
export type SessionExerciseTree = {
  sessionExercise: SessionExercise;
  exercise: Exercise;
  /** The set logs of this session exercise, sorted by `setNumber`. */
  setLogs: SetLog[];
};

/** A session with its mesocycle and every exercise of it, ready for the workout screen. */
export type SessionTree = {
  session: Session;
  mesocycle: Mesocycle;
  /** Sorted by `SessionExercise.order`. */
  exercises: SessionExerciseTree[];
};

/**
 * Reads a whole session as one tree — the shape the workout screen (08.7 · Тренировка) is built
 * from. Assembling Session → Mesocycle, Session → SessionExercise → Exercise and SessionExercise →
 * SetLog is this repository's job, so the use case layer only maps the result (07 · Persistence
 * Layer Contract, rules 2 and 4). No business logic lives here.
 */
export interface SessionTreeRepository {
  /**
   * The tree of session `sessionId`, or `null` if the session doesn't exist. Rejects with
   * `NotFoundError` if the session's mesocycle or one of its exercises is missing — a tree with a
   * hole in it can't be shown.
   */
  getBySessionId(sessionId: string): Promise<SessionTree | null>;
}
