import { isConflictError, isNotFoundError } from '@domain/errors';
import type { Session } from '@domain/execution';
import { createSqliteWorkoutStore } from '@storage/sqlite/workoutStore';
import { startSessionOnFirstSet } from '@usecases/sessionStart';
import { ANY_STAMPS, STAMPS } from '../fixtures/stamps';
import { seedReferences } from '../fixtures/references';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

const FIRST_SET_AT = '2026-09-18T10:00:00.000Z';
const SECOND_SET_AT = '2026-09-18T10:03:00.000Z';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    ...STAMPS,
    id: 'session-w1-d1',
    mesoId: 'meso',
    weekNumber: 1,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'planned',
    ...overrides,
  };
}

async function workoutWith(...sessions: Session[]) {
  const workout = createSqliteWorkoutStore(db());
  await seedReferences(db(), { sessions });
  await workout.repos.sessionRepo.createMany(sessions);
  return workout;
}

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject.');
}

describe('startSessionOnFirstSet', () => {
  test('DoD: the first set moves the session to in_progress and stamps startedAt', async () => {
    const workout = await workoutWith(makeSession());

    const result = await startSessionOnFirstSet('session-w1-d1', workout.repos, FIRST_SET_AT);

    const started = {
      ...makeSession(),
      ...ANY_STAMPS,
      status: 'in_progress',
      startedAt: FIRST_SET_AT,
    };
    expect(result).toEqual({ kind: 'started', session: started });
    await expect(workout.repos.sessionRepo.getById('session-w1-d1')).resolves.toEqual(started);
  });

  test('DoD: later sets leave startedAt unchanged', async () => {
    const workout = await workoutWith(makeSession());
    await startSessionOnFirstSet('session-w1-d1', workout.repos, FIRST_SET_AT);

    const result = await startSessionOnFirstSet('session-w1-d1', workout.repos, SECOND_SET_AT);

    expect(result.kind).toBe('continued');
    const stored = await workout.repos.sessionRepo.getById('session-w1-d1');
    expect(stored?.startedAt).toBe(FIRST_SET_AT);
  });

  test('DoD: rejects an awaiting_source session and leaves it untouched', async () => {
    const awaiting = makeSession({ prescriptionStatus: 'awaiting_source' });
    const workout = await workoutWith(awaiting);

    const error = await rejectionOf(
      startSessionOnFirstSet('session-w1-d1', workout.repos, FIRST_SET_AT),
    );

    expect(isConflictError(error)).toBe(true);
    await expect(workout.repos.sessionRepo.getById('session-w1-d1')).resolves.toEqual(awaiting);
  });

  test.each(['completed', 'skipped'] as const)(
    'DoD: rejects a %s session and leaves it untouched',
    async (status) => {
      const final = makeSession({ status, completedAt: '2026-09-17T11:00:00.000Z' });
      const workout = await workoutWith(final);

      const error = await rejectionOf(
        startSessionOnFirstSet('session-w1-d1', workout.repos, FIRST_SET_AT),
      );

      expect(isConflictError(error)).toBe(true);
      await expect(workout.repos.sessionRepo.getById('session-w1-d1')).resolves.toEqual(final);
    },
  );

  test('DoD: another in_progress session is a conflict with its id, and nothing is written', async () => {
    const other = makeSession({
      id: 'session-w1-d2',
      dayNumber: 2,
      status: 'in_progress',
      startedAt: '2026-09-18T09:00:00.000Z',
    });
    const workout = await workoutWith(makeSession(), other);

    const result = await startSessionOnFirstSet('session-w1-d1', workout.repos, FIRST_SET_AT);

    expect(result).toEqual({ kind: 'conflict', inProgressSessionId: 'session-w1-d2' });
    await expect(workout.repos.sessionRepo.getById('session-w1-d1')).resolves.toEqual(
      makeSession(),
    );
    await expect(workout.repos.sessionRepo.getById('session-w1-d2')).resolves.toEqual(other);
  });

  test('rejects an unknown session with NotFoundError', async () => {
    const workout = await workoutWith();

    const error = await rejectionOf(startSessionOnFirstSet('missing', workout.repos, FIRST_SET_AT));

    expect(isNotFoundError(error)).toBe(true);
  });

  test('a start inside a transaction that later fails is rolled back', async () => {
    const workout = await workoutWith(makeSession());

    await expect(
      workout.transaction(async (repos) => {
        await startSessionOnFirstSet('session-w1-d1', repos, FIRST_SET_AT);
        throw new Error('set log write failed');
      }),
    ).rejects.toThrow('set log write failed');

    await expect(workout.repos.sessionRepo.getById('session-w1-d1')).resolves.toEqual(
      makeSession(),
    );
  });
});
