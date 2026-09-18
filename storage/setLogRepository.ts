import type { Session, SessionExercise, SetLog } from '@domain/execution';
import type {
  FindLastPerformanceQuery,
  ListSetLogsByExerciseIdOptions,
  SetLogRepository,
} from '@repositories/setLogRepository';

import {
  SESSION_COLLECTION,
  SESSION_EXERCISE_COLLECTION,
  SET_LOG_COLLECTION,
} from './collectionNames';
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

  // Groups by the SetLog's own `exerciseId`, not SessionExercise.exerciseId: after a mid-session
  // swap the SessionExercise points at the new exercise while its earlier sets keep the old id
  // (task 047), and only the sets actually performed with `exerciseId` are a valid reference.
  // A group whose SessionExercise or Session is missing can't be proven non-deload, so it is
  // skipped rather than guessed at.
  async findLastPerformance({
    exerciseId,
    mesoId,
    since,
    excludeSessionExerciseId,
  }: FindLastPerformanceQuery): Promise<SetLog[]> {
    const logs = await this.setLogs.find(
      (log) => log.exerciseId === exerciseId && log.sessionExerciseId !== excludeSessionExerciseId,
    );
    const logsBySessionExerciseId = new Map<string, SetLog[]>();
    for (const log of logs) {
      const group = logsBySessionExerciseId.get(log.sessionExerciseId) ?? [];
      group.push(log);
      logsBySessionExerciseId.set(log.sessionExerciseId, group);
    }

    const sessionExercises = await this.store
      .collection<SessionExercise>(SESSION_EXERCISE_COLLECTION)
      .listByIds([...logsBySessionExerciseId.keys()]);
    const sessions = await this.store
      .collection<Session>(SESSION_COLLECTION)
      .listByIds([...new Set(sessionExercises.map((exercise) => exercise.sessionId))]);
    const sessionsById = new Map(sessions.map((session) => [session.id, session]));

    let latest: { logs: SetLog[]; completedAt: string } | null = null;
    for (const sessionExercise of sessionExercises) {
      const session = sessionsById.get(sessionExercise.sessionId);
      const group = logsBySessionExerciseId.get(sessionExercise.id) ?? [];
      const completedAt = group.reduce(
        (max, log) => (log.completedAt > max ? log.completedAt : max),
        '',
      );
      const qualifies =
        session !== undefined &&
        !session.isDeload &&
        (session.mesoId === mesoId || completedAt >= since);
      if (qualifies && (latest === null || completedAt > latest.completedAt)) {
        latest = { logs: group, completedAt };
      }
    }

    return latest ? [...latest.logs].sort((a, b) => a.setNumber - b.setNumber) : [];
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
