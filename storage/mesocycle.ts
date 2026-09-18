import type { Session, SessionExercise, SetLog } from '@domain/execution';
import type { Mesocycle } from '@domain/mesocycle';
import { normalizeStoredMesocycle } from '@domain/mesocycleConverters';
import type { MesocycleRepository } from '@repositories/mesocycle';

import {
  MESOCYCLE_COLLECTION,
  SESSION_COLLECTION,
  SESSION_EXERCISE_COLLECTION,
  SET_LOG_COLLECTION,
} from './collectionNames';
import type { InMemoryStore } from './store';

export class InMemoryMesocycleRepository implements MesocycleRepository {
  constructor(private readonly store: InMemoryStore) {}

  private get mesocycles() {
    return this.store.collection<Mesocycle>(MESOCYCLE_COLLECTION);
  }

  // Every read goes through `normalizeStoredMesocycle`, so a mesocycle saved before a
  // `ProgressionSettings` field existed (e.g. `historyLookbackDays`, task 083) comes back with the
  // spec default for it instead of `undefined`.
  async getAll(): Promise<Mesocycle[]> {
    return (await this.mesocycles.list()).map(normalizeStoredMesocycle);
  }

  async getById(id: string): Promise<Mesocycle | null> {
    const stored = await this.mesocycles.findById(id);
    return stored ? normalizeStoredMesocycle(stored) : null;
  }

  async getActive(): Promise<Mesocycle | null> {
    const [active] = await this.mesocycles.find((mesocycle) => mesocycle.status === 'active');
    return active ? normalizeStoredMesocycle(active) : null;
  }

  async create(mesocycle: Mesocycle): Promise<Mesocycle> {
    return this.mesocycles.insert(mesocycle);
  }

  async update(mesocycle: Mesocycle): Promise<Mesocycle> {
    return this.mesocycles.update(mesocycle.id, () => mesocycle);
  }

  /**
   * Deletes the mesocycle along with every session, session exercise, and set log that
   * hangs off it (07 · Persistence Layer Contract, "Удалить со всеми дочерними данными") —
   * run as one transaction so a failure partway through (e.g. the mesocycle id turning out
   * not to exist) leaves none of the cascade's deletes behind.
   */
  async deleteWithChildren(id: string): Promise<void> {
    await this.store.transaction(async (tx) => {
      const mesocycles = tx.collection<Mesocycle>(MESOCYCLE_COLLECTION);
      const sessions = tx.collection<Session>(SESSION_COLLECTION);
      const sessionExercises = tx.collection<SessionExercise>(SESSION_EXERCISE_COLLECTION);
      const setLogs = tx.collection<SetLog>(SET_LOG_COLLECTION);

      const childSessions = await sessions.find((session) => session.mesoId === id);
      for (const session of childSessions) {
        const childExercises = await sessionExercises.find(
          (exercise) => exercise.sessionId === session.id,
        );
        for (const exercise of childExercises) {
          const childLogs = await setLogs.find((log) => log.sessionExerciseId === exercise.id);
          for (const log of childLogs) {
            await setLogs.delete(log.id);
          }
          await sessionExercises.delete(exercise.id);
        }
        await sessions.delete(session.id);
      }

      await mesocycles.delete(id);
    });
  }
}
