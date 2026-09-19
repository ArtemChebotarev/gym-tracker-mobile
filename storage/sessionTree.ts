import type { Exercise } from '@domain/catalog';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import type { Mesocycle } from '@domain/mesocycle';
import type { SessionTree, SessionTreeRepository } from '@repositories/sessionTree';

import {
  EXERCISE_COLLECTION,
  MESOCYCLE_COLLECTION,
  SESSION_COLLECTION,
  SESSION_EXERCISE_COLLECTION,
  SET_LOG_COLLECTION,
} from './collectionNames';
import { NotFoundError } from './errors';
import type { InMemoryStore } from './store';

// The in-memory stand-in for a backend's `Include()` / JOIN (07 · Persistence Layer Contract, rule
// 4): reads the session's own rows and joins them to their parents and children by id, in memory.
export class InMemorySessionTreeRepository implements SessionTreeRepository {
  constructor(private readonly store: InMemoryStore) {}

  async getBySessionId(sessionId: string): Promise<SessionTree | null> {
    const session = await this.store.collection<Session>(SESSION_COLLECTION).findById(sessionId);
    if (!session) {
      return null;
    }
    const mesocycle = await this.store
      .collection<Mesocycle>(MESOCYCLE_COLLECTION)
      .findById(session.mesoId);
    if (!mesocycle) {
      throw new NotFoundError(
        `Mesocycle "${session.mesoId}" of session "${sessionId}" does not exist.`,
      );
    }

    const sessionExercises = await this.store
      .collection<SessionExercise>(SESSION_EXERCISE_COLLECTION)
      .find((sessionExercise) => sessionExercise.sessionId === sessionId);
    const sessionExerciseIds = new Set(
      sessionExercises.map((sessionExercise) => sessionExercise.id),
    );
    const setLogs = await this.store
      .collection<SetLog>(SET_LOG_COLLECTION)
      .find((log) => sessionExerciseIds.has(log.sessionExerciseId));
    const catalog = await this.store
      .collection<Exercise>(EXERCISE_COLLECTION)
      .listByIds(sessionExercises.map((sessionExercise) => sessionExercise.exerciseId));

    const exercises = [...sessionExercises]
      .sort((a, b) => a.order - b.order)
      .map((sessionExercise) => {
        const exercise = catalog.find((candidate) => candidate.id === sessionExercise.exerciseId);
        if (!exercise) {
          throw new NotFoundError(
            `Exercise "${sessionExercise.exerciseId}" of session exercise "${sessionExercise.id}" does not exist.`,
          );
        }
        return {
          sessionExercise,
          exercise,
          setLogs: setLogs
            .filter((log) => log.sessionExerciseId === sessionExercise.id)
            .sort((a, b) => a.setNumber - b.setNumber),
        };
      });
    return { session, mesocycle, exercises };
  }
}
