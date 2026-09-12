import type { Session, SessionExercise } from '@domain/execution';
import { InMemorySessionRepository } from '@storage/session';
import { InMemorySessionExerciseRepository } from '@storage/sessionExercise';
import { InMemoryStore } from '@storage/store';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    mesoId: 'meso-a',
    weekNumber: 1,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'planned',
    ...overrides,
  };
}

describe('InMemorySessionRepository', () => {
  test('listByMesoId returns every session across all weeks for that mesocycle', async () => {
    const repo = new InMemorySessionRepository(new InMemoryStore());
    await repo.createMany([
      makeSession({ id: 's1', weekNumber: 1 }),
      makeSession({ id: 's2', weekNumber: 2 }),
      makeSession({ id: 's-other', mesoId: 'meso-b' }),
    ]);

    const result = await repo.listByMesoId('meso-a');

    expect(result.map((session) => session.id).sort()).toEqual(['s1', 's2']);
  });

  test('listByMesoIdAndWeekNumber returns only sessions for that mesocycle and week', async () => {
    const repo = new InMemorySessionRepository(new InMemoryStore());
    await repo.createMany([
      makeSession({ id: 's-w1-d1', weekNumber: 1, dayNumber: 1 }),
      makeSession({ id: 's-w1-d2', weekNumber: 1, dayNumber: 2 }),
      makeSession({ id: 's-w2-d1', weekNumber: 2, dayNumber: 1 }),
      makeSession({ id: 's-other-meso', mesoId: 'meso-b', weekNumber: 1, dayNumber: 1 }),
    ]);

    const result = await repo.listByMesoIdAndWeekNumber('meso-a', 1);

    expect(result.map((session) => session.id).sort()).toEqual(['s-w1-d1', 's-w1-d2']);
  });

  test('getLastCompletedByMesoIdAndDayNumber returns the most recently completed session for that day, or null', async () => {
    const repo = new InMemorySessionRepository(new InMemoryStore());
    await expect(repo.getLastCompletedByMesoIdAndDayNumber('meso-a', 1)).resolves.toBeNull();

    const earlier = makeSession({
      id: 's-week1',
      weekNumber: 1,
      dayNumber: 1,
      status: 'completed',
      completedAt: '2026-01-05T10:00:00.000Z',
    });
    const later = makeSession({
      id: 's-week2',
      weekNumber: 2,
      dayNumber: 1,
      status: 'completed',
      completedAt: '2026-01-12T10:00:00.000Z',
    });
    const plannedSameDay = makeSession({
      id: 's-week3',
      weekNumber: 3,
      dayNumber: 1,
      status: 'planned',
    });
    const completedOtherDay = makeSession({
      id: 's-day2',
      weekNumber: 1,
      dayNumber: 2,
      status: 'completed',
      completedAt: '2026-01-20T10:00:00.000Z',
    });
    await repo.createMany([earlier, later, plannedSameDay, completedOtherDay]);

    await expect(repo.getLastCompletedByMesoIdAndDayNumber('meso-a', 1)).resolves.toEqual(later);
  });

  test('getCurrentInProgress returns the single in-progress session, or null', async () => {
    const repo = new InMemorySessionRepository(new InMemoryStore());
    await expect(repo.getCurrentInProgress()).resolves.toBeNull();

    const inProgress = makeSession({ id: 's-active', status: 'in_progress' });
    await repo.createMany([makeSession({ id: 's-planned' }), inProgress]);

    await expect(repo.getCurrentInProgress()).resolves.toEqual(inProgress);
  });

  test('update replaces the stored session', async () => {
    const repo = new InMemorySessionRepository(new InMemoryStore());
    await repo.create(makeSession());

    const updated = await repo.update(
      makeSession({ status: 'in_progress', startedAt: '2026-01-05T09:00:00.000Z' }),
    );

    await expect(repo.getById('session-1')).resolves.toEqual(updated);
  });

  test('assembling a session tree: SessionRepository and SessionExerciseRepository resolve to the same session', async () => {
    const store = new InMemoryStore();
    const sessions = new InMemorySessionRepository(store);
    const sessionExercises = new InMemorySessionExerciseRepository(store);

    const session = makeSession();
    await sessions.create(session);
    const exerciseOne: SessionExercise = {
      id: 'session-exercise-1',
      sessionId: session.id,
      exerciseId: 'exercise-bench-press',
      order: 1,
      setTargets: [{ setNumber: 1, targetReps: 8 }],
      targetRir: 2,
      status: 'planned',
    };
    const exerciseTwo: SessionExercise = {
      id: 'session-exercise-2',
      sessionId: session.id,
      exerciseId: 'exercise-row',
      order: 2,
      setTargets: [{ setNumber: 1, targetReps: 10 }],
      targetRir: 2,
      status: 'planned',
    };
    await sessionExercises.createMany([exerciseOne, exerciseTwo]);

    const tree = {
      session: await sessions.getById(session.id),
      exercises: await sessionExercises.listBySessionId(session.id),
    };

    expect(tree.session).toEqual(session);
    expect(tree.exercises).toEqual(expect.arrayContaining([exerciseOne, exerciseTwo]));
    expect(tree.exercises.every((exercise) => exercise.sessionId === tree.session?.id)).toBe(true);
  });
});
