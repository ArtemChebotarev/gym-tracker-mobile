import type { Session } from '@domain/execution';
import { validateUniqueSessionSlots } from '@domain/executionValidators';
import type { Incoming } from '@domain/timestamps';
import type { SessionRepository } from '@repositories/session';

import { SESSION_COLLECTION } from './collectionNames';
import { ConflictError } from './errors';
import { stampCreated, stampUpdated } from './timestamps';
import type { InMemoryStore } from './store';

export class InMemorySessionRepository implements SessionRepository {
  constructor(private readonly store: InMemoryStore) {}

  private get sessions() {
    return this.store.collection<Session>(SESSION_COLLECTION);
  }

  async getById(id: string): Promise<Session | null> {
    return (await this.sessions.findById(id)) ?? null;
  }

  async listByMesoId(mesoId: string): Promise<Session[]> {
    return this.sessions.find((session) => session.mesoId === mesoId);
  }

  async listByMesoIdAndWeekNumber(mesoId: string, weekNumber: number): Promise<Session[]> {
    return this.sessions.find(
      (session) => session.mesoId === mesoId && session.weekNumber === weekNumber,
    );
  }

  // See 07 · Persistence Layer Contract, "Критичные по производительности запросы": this
  // query is indexed by (mesoId, dayNumber) on a real adapter; a linear scan over the
  // in-memory collection is the explicitly sanctioned stand-in for the first months.
  async getLastCompletedByMesoIdAndDayNumber(
    mesoId: string,
    dayNumber: number,
  ): Promise<Session | null> {
    const completed = await this.sessions.find(
      (session) =>
        session.mesoId === mesoId && session.dayNumber === dayNumber && session.status === 'completed',
    );
    const [mostRecent] = [...completed].sort((a, b) =>
      (b.completedAt ?? '').localeCompare(a.completedAt ?? ''),
    );
    return mostRecent ?? null;
  }

  async getCurrentInProgress(): Promise<Session | null> {
    const [inProgress] = await this.sessions.find((session) => session.status === 'in_progress');
    return inProgress ?? null;
  }

  async create(session: Incoming<Session>): Promise<Session> {
    const [created] = await this.createMany([session]);
    // `createMany` writes exactly as many rows as it is given, so the first one is always there.
    return created!;
  }

  async createMany(sessions: readonly Incoming<Session>[]): Promise<Session[]> {
    const incoming = sessions.map(stampCreated);
    await this.assertSlotsFree(incoming, new Set());
    return Promise.all(incoming.map((session) => this.sessions.insert(session)));
  }

  async update(session: Session): Promise<Session> {
    await this.assertSlotsFree([session], new Set([session.id]));
    return this.sessions.update(session.id, (stored) => stampUpdated(stored, session));
  }

  /**
   * Refuses a write that would put two sessions in the same `(mesoId, weekNumber, dayNumber)`
   * slot — 02 · Domain Model, Session invariants. The SQLite adapter gets this from a unique
   * index; with no such thing here, the check is the domain's own validator run over the
   * collection as it would look after the write, `replacing` naming the rows being overwritten.
   *
   * The validator throws a plain `Error`, as every domain validator does. Turning it into the
   * storage layer's own vocabulary is this layer's job either way (rule 5) — it is the same
   * translation `storage/sqlite/errors.ts` performs on what the driver throws.
   */
  private async assertSlotsFree(
    incoming: readonly Session[],
    replacing: ReadonlySet<string>,
  ): Promise<void> {
    const kept = (await this.sessions.list()).filter((session) => !replacing.has(session.id));
    try {
      validateUniqueSessionSlots([...kept, ...incoming]);
    } catch (error) {
      throw new ConflictError(error instanceof Error ? error.message : String(error));
    }
  }
}
