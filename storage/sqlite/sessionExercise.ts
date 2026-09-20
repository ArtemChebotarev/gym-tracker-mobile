import type { SessionExercise } from '@domain/execution';
import type { Incoming } from '@domain/timestamps';
import type { SessionExerciseRepository } from '@repositories/sessionExercise';
import { eq } from 'drizzle-orm';

import { NotFoundError } from '../errors';
import { stampCreated, stampUpdated } from '../timestamps';
import type { SqliteDatabase } from './db';
import { runQuery } from './errors';
import { rowToSessionExercise, sessionExerciseToRow } from './mappers';
import { sessionExercises } from './schema';

export class SqliteSessionExerciseRepository implements SessionExerciseRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async listBySessionId(sessionId: string): Promise<SessionExercise[]> {
    const rows = await runQuery(() =>
      this.db
        .select()
        .from(sessionExercises)
        .where(eq(sessionExercises.sessionId, sessionId))
        .all(),
    );
    return rows.map(rowToSessionExercise);
  }

  async create(sessionExercise: Incoming<SessionExercise>): Promise<SessionExercise> {
    const [stored] = await this.createMany([sessionExercise]);
    // `createMany` inserts exactly as many rows as it is given, so the first one is always there.
    return stored!;
  }

  async createMany(incoming: readonly Incoming<SessionExercise>[]): Promise<SessionExercise[]> {
    if (incoming.length === 0) {
      return [];
    }
    const stored = incoming.map(stampCreated);
    await runQuery(() =>
      this.db.insert(sessionExercises).values(stored.map(sessionExerciseToRow)).run(),
    );
    return stored;
  }

  async update(sessionExercise: SessionExercise): Promise<SessionExercise> {
    const current = await this.getById(sessionExercise.id);
    if (!current) {
      throw new NotFoundError(`SessionExercise with id "${sessionExercise.id}" was not found.`);
    }
    const next = stampUpdated(current, sessionExercise);
    await runQuery(() =>
      this.db
        .update(sessionExercises)
        .set(sessionExerciseToRow(next))
        .where(eq(sessionExercises.id, next.id))
        .run(),
    );
    return next;
  }

  async updateMany(incoming: readonly SessionExercise[]): Promise<SessionExercise[]> {
    const updated: SessionExercise[] = [];
    for (const sessionExercise of incoming) {
      updated.push(await this.update(sessionExercise));
    }
    return updated;
  }

  async deleteById(id: string): Promise<void> {
    if (!(await this.getById(id))) {
      throw new NotFoundError(`SessionExercise with id "${id}" was not found.`);
    }
    await runQuery(() => this.db.delete(sessionExercises).where(eq(sessionExercises.id, id)).run());
  }

  private async getById(id: string): Promise<SessionExercise | null> {
    const row = await runQuery(() =>
      this.db.select().from(sessionExercises).where(eq(sessionExercises.id, id)).get(),
    );
    return row ? rowToSessionExercise(row) : null;
  }
}
