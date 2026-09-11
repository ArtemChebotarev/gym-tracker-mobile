import type { Session } from '@domain/execution';
import type { SessionRepository } from '@repositories/session';

const week1Day1Completed: Session = {
  id: 'session-w1-d1',
  mesoId: 'meso-1',
  weekNumber: 1,
  dayNumber: 1,
  isDeload: false,
  prescriptionStatus: 'ready',
  status: 'completed',
  completedAt: '2026-08-26T08:00:00.000Z',
};

const week2Day1Completed: Session = {
  id: 'session-w2-d1',
  mesoId: 'meso-1',
  weekNumber: 2,
  dayNumber: 1,
  isDeload: false,
  prescriptionStatus: 'ready',
  status: 'completed',
  completedAt: '2026-09-02T08:00:00.000Z',
};

const week2Day2InProgress: Session = {
  id: 'session-w2-d2',
  mesoId: 'meso-1',
  weekNumber: 2,
  dayNumber: 2,
  isDeload: false,
  prescriptionStatus: 'ready',
  status: 'in_progress',
  startedAt: '2026-09-03T08:00:00.000Z',
};

const otherMesoSession: Session = {
  id: 'session-other-meso',
  mesoId: 'meso-2',
  weekNumber: 1,
  dayNumber: 1,
  isDeload: false,
  prescriptionStatus: 'ready',
  status: 'planned',
};

function createFakeSessionRepository(seed: Session[]): SessionRepository {
  const sessions = [...seed];

  return {
    async getById(id) {
      return sessions.find((session) => session.id === id) ?? null;
    },
    async listByMesoId(mesoId) {
      return sessions.filter((session) => session.mesoId === mesoId);
    },
    async listByMesoIdAndWeekNumber(mesoId, weekNumber) {
      return sessions.filter(
        (session) => session.mesoId === mesoId && session.weekNumber === weekNumber,
      );
    },
    async getLastCompletedByMesoIdAndDayNumber(mesoId, dayNumber) {
      const matches = sessions
        .filter(
          (session) =>
            session.mesoId === mesoId &&
            session.dayNumber === dayNumber &&
            session.status === 'completed',
        )
        .sort((a, b) => b.weekNumber - a.weekNumber);
      return matches[0] ?? null;
    },
    async getCurrentInProgress() {
      return sessions.find((session) => session.status === 'in_progress') ?? null;
    },
    async create(session) {
      sessions.push(session);
      return session;
    },
    async createMany(newSessions) {
      sessions.push(...newSessions);
      return [...newSessions];
    },
    async update(session) {
      const index = sessions.findIndex((existing) => existing.id === session.id);
      if (index !== -1) {
        sessions[index] = session;
      }
      return session;
    },
  };
}

describe('SessionRepository contract', () => {
  test('listByMesoId returns only sessions for that mesocycle', async () => {
    const repo = createFakeSessionRepository([week1Day1Completed, week2Day1Completed, otherMesoSession]);

    const result = await repo.listByMesoId('meso-1');

    expect(result).toEqual([week1Day1Completed, week2Day1Completed]);
  });

  test('listByMesoIdAndWeekNumber narrows down to a single week', async () => {
    const repo = createFakeSessionRepository([week1Day1Completed, week2Day1Completed, week2Day2InProgress]);

    await expect(repo.listByMesoIdAndWeekNumber('meso-1', 2)).resolves.toEqual([
      week2Day1Completed,
      week2Day2InProgress,
    ]);
  });

  test('getLastCompletedByMesoIdAndDayNumber returns the most recently completed session of that day', async () => {
    const repo = createFakeSessionRepository([week1Day1Completed, week2Day1Completed, week2Day2InProgress]);

    await expect(repo.getLastCompletedByMesoIdAndDayNumber('meso-1', 1)).resolves.toEqual(
      week2Day1Completed,
    );
    await expect(repo.getLastCompletedByMesoIdAndDayNumber('meso-1', 2)).resolves.toBeNull();
  });

  test('getCurrentInProgress returns the single in_progress session, or null when none is', async () => {
    const withInProgress = createFakeSessionRepository([week1Day1Completed, week2Day2InProgress]);
    await expect(withInProgress.getCurrentInProgress()).resolves.toEqual(week2Day2InProgress);

    const withoutInProgress = createFakeSessionRepository([week1Day1Completed]);
    await expect(withoutInProgress.getCurrentInProgress()).resolves.toBeNull();
  });

  test('create, createMany, and update round-trip sessions by their domain-generated id', async () => {
    const repo = createFakeSessionRepository([]);

    await repo.create(week1Day1Completed);
    await repo.createMany([week2Day1Completed, week2Day2InProgress]);
    await expect(repo.listByMesoId('meso-1')).resolves.toHaveLength(3);

    const updated: Session = { ...week2Day2InProgress, status: 'completed', completedAt: '2026-09-03T09:00:00.000Z' };
    await repo.update(updated);
    await expect(repo.getById(updated.id)).resolves.toEqual(updated);
  });
});
