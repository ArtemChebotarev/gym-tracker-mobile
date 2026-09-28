import type { SetLog } from '@domain/execution';
import type { ExercisePerformance } from '@domain/progression';
import type { Incoming } from '@domain/timestamps';
import type {
  FindLastPerformanceQuery,
  LastPerformance,
  ListPerformancesQuery,
  ListSetLogsByExerciseIdOptions,
  SetLogRepository,
} from '@repositories/setLogRepository';
import { asc, desc, eq } from 'drizzle-orm';

import { NotFoundError } from '../errors';
import { stampCreated, stampUpdated } from '../timestamps';
import type { SqliteDatabase } from './db';
import { runQuery } from './errors';
import { performedAt, readExercisePerformances } from './exerciseHistory';
import { rowToSetLog, setLogToRow } from './mappers';
import { sessionExercises, setLogs } from './schema';

export class SqliteSetLogRepository implements SetLogRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async listBySessionExerciseId(sessionExerciseId: string): Promise<SetLog[]> {
    const rows = await runQuery(() =>
      this.db.select().from(setLogs).where(eq(setLogs.sessionExerciseId, sessionExerciseId)).all(),
    );
    return rows.map(rowToSetLog);
  }

  // SetLog only carries `sessionExerciseId` (02 · Domain Model) — assembling "every set logged in
  // this session" is this repository's job (07 · Persistence Layer Contract, rule 4), so it joins
  // through `session_exercise` itself rather than making the caller do it.
  async listBySessionId(sessionId: string): Promise<SetLog[]> {
    const rows = await runQuery(() =>
      this.db
        .select({ setLog: setLogs })
        .from(setLogs)
        .innerJoin(sessionExercises, eq(setLogs.sessionExerciseId, sessionExercises.id))
        .where(eq(sessionExercises.sessionId, sessionId))
        .all(),
    );
    return rows.map(({ setLog }) => rowToSetLog(setLog));
  }

  // One of the two queries 07 calls performance-critical — it is run on every workout-screen open
  // to prefill weight — and it reads the `(exercise_id, completed_at)` index.
  async listByExerciseId(
    exerciseId: string,
    options?: ListSetLogsByExerciseIdOptions,
  ): Promise<SetLog[]> {
    const ascending = options?.order === 'asc';
    const rows = await runQuery(() => {
      const query = this.db
        .select()
        .from(setLogs)
        .where(eq(setLogs.exerciseId, exerciseId))
        .orderBy(ascending ? asc(setLogs.completedAt) : desc(setLogs.completedAt));
      return options?.limit === undefined ? query.all() : query.limit(options.limit).all();
    });
    return rows.map(rowToSetLog);
  }

  async getLastByExerciseId(exerciseId: string): Promise<SetLog | null> {
    const [last] = await this.listByExerciseId(exerciseId, { order: 'desc', limit: 1 });
    return last ?? null;
  }

  /**
   * Rule 6's reference (03 · Progression Engine): the newest performance that qualifies. The
   * Session join it needs is the same one exercise history starts from, so it comes from
   * `readExercisePerformances` rather than being written out a second time here — this method
   * only adds the rule's own narrowing on top.
   */
  async findLastPerformance({
    exerciseId,
    mesoId,
    since,
    excludeSessionExerciseId,
  }: FindLastPerformanceQuery): Promise<LastPerformance | null> {
    const performances = (
      await readExercisePerformances(this.db, exerciseId, { excludeSessionExerciseId })
    ).map((performance) => ({ ...performance, completedAt: performedAt(performance) }));
    performances.sort((a, b) => b.completedAt.localeCompare(a.completedAt));

    for (const { session, setLogs: logs, targetRir, completedAt } of performances) {
      if (!session.isDeload && (session.mesoId === mesoId || completedAt >= since)) {
        return { setLogs: logs, targetRir };
      }
    }
    return null;
  }

  /**
   * The reference resolver's window (task 134.1). The same join as `findLastPerformance`, cut to
   * `since` and flattened into where each performance stood in its block.
   */
  async listPerformances({
    exerciseId,
    since,
    excludeSessionExerciseId,
  }: ListPerformancesQuery): Promise<ExercisePerformance[]> {
    const performances = await readExercisePerformances(this.db, exerciseId, {
      excludeSessionExerciseId,
    });
    return performances
      .map((performance): ExercisePerformance => ({
        mesoId: performance.session.mesoId,
        weekNumber: performance.session.weekNumber,
        dayNumber: performance.session.dayNumber,
        isDeload: performance.session.isDeload,
        targetRir: performance.targetRir,
        performedAt: performedAt(performance),
        setLogs: performance.setLogs,
      }))
      .filter((performance) => performance.performedAt >= since)
      .sort((a, b) => b.performedAt.localeCompare(a.performedAt));
  }

  async create(setLog: Incoming<SetLog>): Promise<SetLog> {
    const stored = stampCreated(setLog);
    await runQuery(() => this.db.insert(setLogs).values(setLogToRow(stored)).run());
    return stored;
  }

  async update(setLog: SetLog): Promise<SetLog> {
    const current = await this.getById(setLog.id);
    if (!current) {
      throw new NotFoundError(`SetLog with id "${setLog.id}" was not found.`);
    }
    const next = stampUpdated(current, setLog);
    await runQuery(() =>
      this.db.update(setLogs).set(setLogToRow(next)).where(eq(setLogs.id, next.id)).run(),
    );
    return next;
  }

  async deleteById(id: string): Promise<void> {
    if (!(await this.getById(id))) {
      throw new NotFoundError(`SetLog with id "${id}" was not found.`);
    }
    await runQuery(() => this.db.delete(setLogs).where(eq(setLogs.id, id)).run());
  }

  private async getById(id: string): Promise<SetLog | null> {
    const row = await runQuery(() =>
      this.db.select().from(setLogs).where(eq(setLogs.id, id)).get(),
    );
    return row ? rowToSetLog(row) : null;
  }
}
