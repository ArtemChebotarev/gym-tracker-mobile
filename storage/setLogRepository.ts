import type { SessionExercise, SetLog } from '@domain/execution';
import type { ListSetLogsByExerciseIdOptions, SetLogRepository } from '@repositories/setLogRepository';

import { SESSION_EXERCISE_COLLECTION, SET_LOG_COLLECTION } from './collectionNames';
import type { InMemoryStore } from './store';

export class InMemorySetLogRepository implements SetLogRepository {
  constructor(private readonly store: InMemoryStore) {}

  private get setLogs() {
    return this.store.collection<SetLog>(SET_LOG_COLLECTION);
  }

  async listBySessionExerciseId(sessionExerciseId: string): Promise<SetLog[]> {
    return this.setLogs.find((log) => log.sessionExerciseId === sessionExerciseId);
  }

  // SetLog only carries `sessionExerciseId` (02 · Domain Model) — assembling "every set
  // logged in this session" is this repository's job (07 · Persistence Layer Contract, rule
  // 4), so it joins through the SessionExercise collection itself rather than making the
  // caller do it.
  async listBySessionId(sessionId: string): Promise<SetLog[]> {
    const sessionExercises = this.store.collection<SessionExercise>(SESSION_EXERCISE_COLLECTION);
    const exercisesInSession = await sessionExercises.find(
      (exercise) => exercise.sessionId === sessionId,
    );
    const sessionExerciseIds = new Set(exercisesInSession.map((exercise) => exercise.id));
    return this.setLogs.find((log) => sessionExerciseIds.has(log.sessionExerciseId));
  }

  // See 07 · Persistence Layer Contract, "Критичные по производительности запросы": this is
  // called on every workout-screen open to prefill weight, and a real adapter must keep an
  // `exerciseId -> set log ids` index. A linear scan over the in-memory collection is the
  // explicitly sanctioned stand-in for the first months.
  async listByExerciseId(
    exerciseId: string,
    options?: ListSetLogsByExerciseIdOptions,
  ): Promise<SetLog[]> {
    const matches = await this.setLogs.find((log) => log.exerciseId === exerciseId);
    const order = options?.order ?? 'desc';
    const sorted = [...matches].sort((a, b) =>
      order === 'asc'
        ? a.completedAt.localeCompare(b.completedAt)
        : b.completedAt.localeCompare(a.completedAt),
    );
    return options?.limit !== undefined ? sorted.slice(0, options.limit) : sorted;
  }

  async getLastByExerciseId(exerciseId: string): Promise<SetLog | null> {
    const [last] = await this.listByExerciseId(exerciseId, { order: 'desc', limit: 1 });
    return last ?? null;
  }

  async create(setLog: SetLog): Promise<SetLog> {
    return this.setLogs.insert(setLog);
  }

  async update(setLog: SetLog): Promise<SetLog> {
    return this.setLogs.update(setLog.id, () => setLog);
  }

  async deleteById(id: string): Promise<void> {
    await this.setLogs.delete(id);
  }
}
