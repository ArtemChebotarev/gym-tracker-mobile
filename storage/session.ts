import type { Session } from '@domain/execution';
import type { Incoming } from '@domain/timestamps';
import type { SessionRepository } from '@repositories/session';

import { SESSION_COLLECTION } from './collectionNames';
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
    return this.sessions.insert(stampCreated(session));
  }

  async createMany(sessions: readonly Incoming<Session>[]): Promise<Session[]> {
    return Promise.all(sessions.map((session) => this.sessions.insert(stampCreated(session))));
  }

  async update(session: Session): Promise<Session> {
    return this.sessions.update(session.id, (stored) => stampUpdated(stored, session));
  }
}
