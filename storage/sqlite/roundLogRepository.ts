import type { RoundLog } from '@domain/execution';
import type { Incoming } from '@domain/timestamps';
import type {
  ListRoundLogsByExerciseIdOptions,
  RoundLogRepository,
} from '@repositories/roundLogRepository';
import { asc, desc, eq } from 'drizzle-orm';

import { NotFoundError } from '../errors';
import { stampCreated, stampUpdated } from '../timestamps';
import type { SqliteDatabase } from './db';
import { runQuery } from './errors';
import { rowToRoundLog, roundLogToRow } from './mappers';
import { roundLogs, sessionExercises } from './schema';

export class SqliteRoundLogRepository implements RoundLogRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async listBySessionExerciseId(sessionExerciseId: string): Promise<RoundLog[]> {
    const rows = await runQuery(() =>
      this.db
        .select()
        .from(roundLogs)
        .where(eq(roundLogs.sessionExerciseId, sessionExerciseId))
        .orderBy(asc(roundLogs.roundNumber))
        .all(),
    );
    return rows.map(rowToRoundLog);
  }

  // A round only carries `sessionExerciseId`, like a set log: the join to the session is this
  // repository's job (07 · Persistence Layer Contract, rule 4), not the caller's.
  async listBySessionId(sessionId: string): Promise<RoundLog[]> {
    const rows = await runQuery(() =>
      this.db
        .select({ roundLog: roundLogs })
        .from(roundLogs)
        .innerJoin(sessionExercises, eq(roundLogs.sessionExerciseId, sessionExercises.id))
        .where(eq(sessionExercises.sessionId, sessionId))
        .orderBy(asc(roundLogs.sessionExerciseId), asc(roundLogs.roundNumber))
        .all(),
    );
    return rows.map(({ roundLog }) => rowToRoundLog(roundLog));
  }

  async listByExerciseId(
    exerciseId: string,
    options?: ListRoundLogsByExerciseIdOptions,
  ): Promise<RoundLog[]> {
    const ascending = options?.order === 'asc';
    const rows = await runQuery(() => {
      const query = this.db
        .select()
        .from(roundLogs)
        .where(eq(roundLogs.exerciseId, exerciseId))
        .orderBy(ascending ? asc(roundLogs.completedAt) : desc(roundLogs.completedAt));
      return options?.limit === undefined ? query.all() : query.limit(options.limit).all();
    });
    return rows.map(rowToRoundLog);
  }

  async getLastByExerciseId(exerciseId: string): Promise<RoundLog | null> {
    const [last] = await this.listByExerciseId(exerciseId, { order: 'desc', limit: 1 });
    return last ?? null;
  }

  async create(roundLog: Incoming<RoundLog>): Promise<RoundLog> {
    const stored = stampCreated(roundLog);
    await runQuery(() => this.db.insert(roundLogs).values(roundLogToRow(stored)).run());
    return stored;
  }

  async update(roundLog: RoundLog): Promise<RoundLog> {
    const current = await this.getById(roundLog.id);
    if (!current) {
      throw new NotFoundError(`RoundLog with id "${roundLog.id}" was not found.`);
    }
    const next = stampUpdated(current, roundLog);
    await runQuery(() =>
      this.db.update(roundLogs).set(roundLogToRow(next)).where(eq(roundLogs.id, next.id)).run(),
    );
    return next;
  }

  async deleteById(id: string): Promise<void> {
    if (!(await this.getById(id))) {
      throw new NotFoundError(`RoundLog with id "${id}" was not found.`);
    }
    await runQuery(() => this.db.delete(roundLogs).where(eq(roundLogs.id, id)).run());
  }

  private async getById(id: string): Promise<RoundLog | null> {
    const row = await runQuery(() =>
      this.db.select().from(roundLogs).where(eq(roundLogs.id, id)).get(),
    );
    return row ? rowToRoundLog(row) : null;
  }
}
