import type { SessionExercise, SetLog } from '@domain/execution';
import type {
  FindLastPerformanceQuery,
  ListSetLogsByExerciseIdOptions,
  SetLogRepository,
} from '@repositories/setLogRepository';

import { SESSION_EXERCISE_COLLECTION, SET_LOG_COLLECTION } from './collectionNames';
import { readExercisePerformances } from './exerciseHistory';
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

  // Rule 6's reference (03 · Progression Engine): the newest performance that qualifies. The
  // Session join it needs is the same one exercise history starts from, so it comes from
  // `readExercisePerformances` rather than being written out a second time here — this method only
  // adds the rule's own narrowing on top.
  //
  // A performance whose SessionExercise or Session is missing can't be checked for deload or
  // mesocycle, so hitting one before a valid reference ends the search with no reference at all:
  // without a trustworthy reference rule 6 recommends nothing and the screen shows only RIR,
  // rather than falling back to an older, possibly wrong one. (Exercise history, reading the same
  // join, simply drops such a performance — it has nothing to be wrong about.)
  async findLastPerformance({
    exerciseId,
    mesoId,
    since,
    excludeSessionExerciseId,
  }: FindLastPerformanceQuery): Promise<SetLog[]> {
    const performances = (
      await readExercisePerformances(this.store, exerciseId, { excludeSessionExerciseId })
    ).map(({ session, setLogs }) => ({
      session,
      setLogs,
      completedAt: setLogs.reduce(
        (max, log) => (log.completedAt > max ? log.completedAt : max),
        '',
      ),
    }));
    performances.sort((a, b) => b.completedAt.localeCompare(a.completedAt));

    for (const { session, setLogs, completedAt } of performances) {
      if (session === undefined) {
        return [];
      }
      if (!session.isDeload && (session.mesoId === mesoId || completedAt >= since)) {
        return setLogs;
      }
    }
    return [];
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
