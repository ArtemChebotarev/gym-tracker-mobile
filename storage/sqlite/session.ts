import type { Session } from '@domain/execution';
import type { Incoming } from '@domain/timestamps';
import type { SessionRepository } from '@repositories/session';
import { and, desc, eq } from 'drizzle-orm';

import { NotFoundError } from '../errors';
import { stampCreated, stampUpdated } from '../timestamps';
import type { SqliteDatabase } from './db';
import { runQuery } from './errors';
import { rowToSession, sessionToRow } from './mappers';
import { sessions } from './schema';

export class SqliteSessionRepository implements SessionRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async getById(id: string): Promise<Session | null> {
    const row = await runQuery(() =>
      this.db.select().from(sessions).where(eq(sessions.id, id)).get(),
    );
    return row ? rowToSession(row) : null;
  }

  async listByMesoId(mesoId: string): Promise<Session[]> {
    const rows = await runQuery(() =>
      this.db.select().from(sessions).where(eq(sessions.mesoId, mesoId)).all(),
    );
    return rows.map(rowToSession);
  }

  async listByMesoIdAndWeekNumber(mesoId: string, weekNumber: number): Promise<Session[]> {
    const rows = await runQuery(() =>
      this.db
        .select()
        .from(sessions)
        .where(and(eq(sessions.mesoId, mesoId), eq(sessions.weekNumber, weekNumber)))
        .all(),
    );
    return rows.map(rowToSession);
  }

  // The source-session lookup of every generation (03 · Progression Engine, "Ленивая генерация по
  // дням"), and one of the two queries 07 calls performance-critical: it reads the
  // `(meso_id, day_number, status)` index instead of scanning the mesocycle's sessions.
  async getLastCompletedByMesoIdAndDayNumber(
    mesoId: string,
    dayNumber: number,
  ): Promise<Session | null> {
    const row = await runQuery(() =>
      this.db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.mesoId, mesoId),
            eq(sessions.dayNumber, dayNumber),
            eq(sessions.status, 'completed'),
          ),
        )
        .orderBy(desc(sessions.completedAt))
        .limit(1)
        .get(),
    );
    return row ? rowToSession(row) : null;
  }

  async getCurrentInProgress(): Promise<Session | null> {
    const row = await runQuery(() =>
      this.db.select().from(sessions).where(eq(sessions.status, 'in_progress')).get(),
    );
    return row ? rowToSession(row) : null;
  }

  async create(session: Incoming<Session>): Promise<Session> {
    const [stored] = await this.createMany([session]);
    // `createMany` inserts exactly as many rows as it is given, so the first one is always there.
    return stored!;
  }

  async createMany(incoming: readonly Incoming<Session>[]): Promise<Session[]> {
    if (incoming.length === 0) {
      return [];
    }
    const stored = incoming.map(stampCreated);
    await runQuery(() => this.db.insert(sessions).values(stored.map(sessionToRow)).run());
    return stored;
  }

  async update(session: Session): Promise<Session> {
    const current = await this.getById(session.id);
    if (!current) {
      throw new NotFoundError(`Session with id "${session.id}" was not found.`);
    }
    const next = stampUpdated(current, session);
    await runQuery(() =>
      this.db.update(sessions).set(sessionToRow(next)).where(eq(sessions.id, next.id)).run(),
    );
    return next;
  }
}
