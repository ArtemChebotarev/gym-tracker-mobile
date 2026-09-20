import { makeSession, seedParents } from './fixtures';
import { type RepositoryHarness, useRepositories } from './harness';

// SessionRepository — see 07 · Persistence Layer Contract, "SessionRepository", and
// repositories/session.ts. `getLastCompletedByMesoIdAndDayNumber` is one of the two queries
// 07 calls out as performance-critical; correctness of its result is what this suite pins
// down, its cost is task 068's business.

export function describeSessionContract(harness: RepositoryHarness): void {
  describe('SessionRepository', () => {
    const repositories = useRepositories(harness);

    beforeEach(async () => {
      await seedParents(repositories(), { mesoIds: ['meso-a', 'meso-b'] });
    });

    test('getById round-trips a session and resolves null for an unknown id', async () => {
      const { sessionRepo } = repositories();
      const session = await sessionRepo.create(makeSession());

      await expect(sessionRepo.getById(session.id)).resolves.toEqual(session);
      await expect(sessionRepo.getById('missing')).resolves.toBeNull();
    });

    test('listByMesoId returns every session of that mesocycle across all weeks', async () => {
      const { sessionRepo } = repositories();
      await sessionRepo.createMany([
        makeSession({ id: 's1', weekNumber: 1 }),
        makeSession({ id: 's2', weekNumber: 2 }),
        makeSession({ id: 's-other', mesoId: 'meso-b' }),
      ]);

      const sessions = await sessionRepo.listByMesoId('meso-a');

      expect(sessions.map((session) => session.id).sort()).toEqual(['s1', 's2']);
    });

    test('listByMesoIdAndWeekNumber narrows down to one mesocycle and week', async () => {
      const { sessionRepo } = repositories();
      await sessionRepo.createMany([
        makeSession({ id: 's-w1-d1', weekNumber: 1, dayNumber: 1 }),
        makeSession({ id: 's-w1-d2', weekNumber: 1, dayNumber: 2 }),
        makeSession({ id: 's-w2-d1', weekNumber: 2, dayNumber: 1 }),
        makeSession({ id: 's-other-meso', mesoId: 'meso-b', weekNumber: 1 }),
      ]);

      const sessions = await sessionRepo.listByMesoIdAndWeekNumber('meso-a', 1);

      expect(sessions.map((session) => session.id).sort()).toEqual(['s-w1-d1', 's-w1-d2']);
    });

    test('getLastCompletedByMesoIdAndDayNumber returns the most recently completed session of that day, or null', async () => {
      const { sessionRepo } = repositories();
      await expect(
        sessionRepo.getLastCompletedByMesoIdAndDayNumber('meso-a', 1),
      ).resolves.toBeNull();

      const later = makeSession({
        id: 's-week2',
        weekNumber: 2,
        dayNumber: 1,
        status: 'completed',
        completedAt: '2026-01-12T10:00:00.000Z',
      });
      const [, storedLater] = await sessionRepo.createMany([
        makeSession({
          id: 's-week1',
          weekNumber: 1,
          dayNumber: 1,
          status: 'completed',
          completedAt: '2026-01-05T10:00:00.000Z',
        }),
        later,
        // Neither a planned session of the same day nor a completed one of another day counts.
        makeSession({ id: 's-week3', weekNumber: 3, dayNumber: 1, status: 'planned' }),
        makeSession({
          id: 's-day2',
          weekNumber: 1,
          dayNumber: 2,
          status: 'completed',
          completedAt: '2026-01-20T10:00:00.000Z',
        }),
      ]);

      await expect(sessionRepo.getLastCompletedByMesoIdAndDayNumber('meso-a', 1)).resolves.toEqual(
        storedLater,
      );
    });

    test('getCurrentInProgress returns the single in-progress session, or null', async () => {
      const { sessionRepo } = repositories();
      await expect(sessionRepo.getCurrentInProgress()).resolves.toBeNull();

      const [, inProgress] = await sessionRepo.createMany([
        makeSession({ id: 's-planned' }),
        makeSession({ id: 's-active', status: 'in_progress' }),
      ]);

      await expect(sessionRepo.getCurrentInProgress()).resolves.toEqual(inProgress);
    });

    test('createMany persists a whole week of sessions in one call', async () => {
      const { sessionRepo } = repositories();

      const created = await sessionRepo.createMany([
        makeSession({ id: 's-d1', dayNumber: 1 }),
        makeSession({ id: 's-d2', dayNumber: 2 }),
        makeSession({ id: 's-d3', dayNumber: 3 }),
      ]);

      expect(created.map((session) => session.id)).toEqual(['s-d1', 's-d2', 's-d3']);
      await expect(sessionRepo.listByMesoId('meso-a')).resolves.toHaveLength(3);
    });

    test('update replaces the stored session', async () => {
      const { sessionRepo } = repositories();
      const stored = await sessionRepo.create(makeSession());

      const updated = await sessionRepo.update({
        ...stored,
        status: 'in_progress',
        startedAt: '2026-01-05T09:00:00.000Z',
      });

      await expect(sessionRepo.getById('session-1')).resolves.toEqual(updated);
    });
  });
}
