import type { Mesocycle } from '@domain/mesocycle';
import { normalizeStoredMesocycle } from '@domain/mesocycleConverters';
import type { Incoming } from '@domain/timestamps';
import type { MesocycleRepository } from '@repositories/mesocycle';
import { eq, inArray } from 'drizzle-orm';

import { NotFoundError } from '../errors';
import { stampCreated, stampUpdated } from '../timestamps';
import type { SqliteDatabase } from './db';
import { runQuery } from './errors';
import { mesocycleToRow, rowToMesocycle } from './mappers';
import { mesocycles, sessionExercises, sessions, setLogs } from './schema';
import { runInTransaction } from './transaction';

export class SqliteMesocycleRepository implements MesocycleRepository {
  constructor(private readonly db: SqliteDatabase) {}

  // Every read goes through `normalizeStoredMesocycle`, so a mesocycle saved before a
  // `ProgressionSettings` field existed (e.g. `historyLookbackDays`, task 083) comes back with the
  // spec default for it instead of `undefined`.
  async getAll(): Promise<Mesocycle[]> {
    const rows = await runQuery(() => this.db.select().from(mesocycles).all());
    return rows.map((row) => normalizeStoredMesocycle(rowToMesocycle(row)));
  }

  async getById(id: string): Promise<Mesocycle | null> {
    const row = await runQuery(() =>
      this.db.select().from(mesocycles).where(eq(mesocycles.id, id)).get(),
    );
    return row ? normalizeStoredMesocycle(rowToMesocycle(row)) : null;
  }

  async getActive(): Promise<Mesocycle | null> {
    const row = await runQuery(() =>
      this.db.select().from(mesocycles).where(eq(mesocycles.status, 'active')).get(),
    );
    return row ? normalizeStoredMesocycle(rowToMesocycle(row)) : null;
  }

  async create(mesocycle: Incoming<Mesocycle>): Promise<Mesocycle> {
    const stored = stampCreated(mesocycle);
    await runQuery(() => this.db.insert(mesocycles).values(mesocycleToRow(stored)).run());
    return stored;
  }

  async update(mesocycle: Mesocycle): Promise<Mesocycle> {
    const current = await this.getById(mesocycle.id);
    if (!current) {
      throw new NotFoundError(`Mesocycle with id "${mesocycle.id}" was not found.`);
    }
    const next = stampUpdated(current, mesocycle);
    await runQuery(() =>
      this.db.update(mesocycles).set(mesocycleToRow(next)).where(eq(mesocycles.id, next.id)).run(),
    );
    return next;
  }

  /**
   * Deletes the mesocycle along with every session, session exercise and set log that hangs off
   * it (07 · Persistence Layer Contract, "Удалить со всеми дочерними данными"), as one
   * transaction: a mesocycle whose sessions are already gone would be worse than either end state.
   *
   * The cascade is written out rather than left to `ON DELETE CASCADE`, because the schema's
   * foreign keys deliberately don't declare one: a child row disappearing as a side effect of
   * a statement that never named it is exactly the kind of implicit behaviour the contract asks
   * the repository to own (rule 4). Deleting children before parents is also what keeps the
   * foreign keys satisfied at every step.
   */
  async deleteWithChildren(id: string): Promise<void> {
    await runInTransaction(this.db, async () => {
      if (!(await this.getById(id))) {
        throw new NotFoundError(`Mesocycle with id "${id}" was not found.`);
      }

      const sessionIds = await runQuery(() =>
        this.db
          .select({ id: sessions.id })
          .from(sessions)
          .where(eq(sessions.mesoId, id))
          .all()
          .map((row) => row.id),
      );
      if (sessionIds.length > 0) {
        const sessionExerciseIds = await runQuery(() =>
          this.db
            .select({ id: sessionExercises.id })
            .from(sessionExercises)
            .where(inArray(sessionExercises.sessionId, sessionIds))
            .all()
            .map((row) => row.id),
        );
        if (sessionExerciseIds.length > 0) {
          await runQuery(() =>
            this.db
              .delete(setLogs)
              .where(inArray(setLogs.sessionExerciseId, sessionExerciseIds))
              .run(),
          );
          await runQuery(() =>
            this.db
              .delete(sessionExercises)
              .where(inArray(sessionExercises.id, sessionExerciseIds))
              .run(),
          );
        }
        await runQuery(() =>
          this.db.delete(sessions).where(inArray(sessions.id, sessionIds)).run(),
        );
      }

      await runQuery(() => this.db.delete(mesocycles).where(eq(mesocycles.id, id)).run());
    });
  }
}
