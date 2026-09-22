import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import type { Session } from '@domain/execution';
import { isConflictError, isStorageUnavailableError } from '@domain/errors';
import type { Unsaved } from '@domain/timestamps';
import { createSqliteRepositories } from '@storage/sqlite/repositories';

import { emptyTestDatabase } from '../fixtures/sqliteDatabase';

// What is this adapter's own business rather than the repository contract's (task 067). The
// contract says what every implementation does; these say how *this* one behaves where a
// relational store has answers of its own: which driver failure becomes which domain error, that
// a dropped field is actually cleared, and how a transaction inside a transaction behaves. See `sqliteContract.test.ts` for the shared suite.

async function createRepositories() {
  const { db, close } = await emptyTestDatabase();
  return { close, ...createSqliteRepositories(db) };
}

function makeMesocycle(overrides: Partial<Unsaved<Mesocycle>> = {}): Unsaved<Mesocycle> {
  return {
    id: 'meso-a',
    name: 'Push Pull Legs',
    lengthWeeks: 6,
    daysPerWeek: 3,
    status: 'active',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    ...overrides,
  };
}

function makeSession(overrides: Partial<Unsaved<Session>> = {}): Unsaved<Session> {
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

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject.');
}

describe('the SQLite adapter’s normalized errors', () => {
  test('a duplicate id becomes a ConflictError carrying the driver’s error as its cause', async () => {
    const { mesocycleRepo, close } = await createRepositories();
    await mesocycleRepo.create(makeMesocycle());

    const error = await rejectionOf(mesocycleRepo.create(makeMesocycle()));

    expect(isConflictError(error)).toBe(true);
    expect((error as Error).message).toMatch(/UNIQUE constraint failed/i);
    // Checked by what the cause says, not by `instanceof`: better-sqlite3 is a native module, so
    // its own error class does not reliably match the test sandbox's `Error` constructor.
    expect((error as { cause?: Error }).cause?.message).toMatch(/UNIQUE constraint failed/i);
    close();
  });

  test('a reference to a row that is not there becomes a ConflictError', async () => {
    const { sessionRepo, close } = await createRepositories();

    const error = await rejectionOf(sessionRepo.create(makeSession({ mesoId: 'meso-gone' })));

    expect(isConflictError(error)).toBe(true);
    expect((error as Error).message).toMatch(/FOREIGN KEY constraint failed/i);
    close();
  });

  test('a database that cannot answer at all becomes a StorageUnavailableError', async () => {
    const { mesocycleRepo, close } = await createRepositories();
    close();

    expect(isStorageUnavailableError(await rejectionOf(mesocycleRepo.getAll()))).toBe(true);
  });
});

describe('the SQLite adapter’s writes', () => {
  test('an update clears a column whose field the entity no longer carries', async () => {
    const { mesocycleRepo, sessionRepo, close } = await createRepositories();
    await mesocycleRepo.create(makeMesocycle());
    const completed = await sessionRepo.create(
      makeSession({ status: 'completed', completedAt: '2026-01-05T10:00:00.000Z' }),
    );

    // Reopened: the session goes back to in progress, and the moment it was completed is gone.
    const { completedAt: _dropped, ...reopened } = completed;
    await sessionRepo.update({ ...reopened, status: 'in_progress' });

    await expect(sessionRepo.getById('session-1')).resolves.not.toHaveProperty('completedAt');
    close();
  });

  test('a transaction inside a transaction rolls back with the outer one, not on its own', async () => {
    const { mesocycleRepo, workoutStore, close } = await createRepositories();
    const mesocycle = await mesocycleRepo.create(makeMesocycle());
    const session = await workoutStore.repos.sessionRepo.create(makeSession());

    // `deleteWithChildren` runs a transaction of its own; nested in one it must become a
    // savepoint, so the outer failure takes its deletes back with everything else.
    await expect(
      workoutStore.transaction(async (repos) => {
        await repos.sessionRepo.update({ ...session, status: 'in_progress' });
        await mesocycleRepo.deleteWithChildren('meso-a');
        throw new Error('failure partway through');
      }),
    ).rejects.toThrow('failure partway through');

    await expect(mesocycleRepo.getById('meso-a')).resolves.toEqual(mesocycle);
    await expect(workoutStore.repos.sessionRepo.getById('session-1')).resolves.toEqual(session);
    close();
  });

  test('a nested transaction that fails alone leaves the outer one free to commit', async () => {
    const { mesocycleRepo, workoutStore, close } = await createRepositories();
    await mesocycleRepo.create(makeMesocycle());
    const session = await workoutStore.repos.sessionRepo.create(makeSession());

    const updated = await workoutStore.transaction(async (repos) => {
      await expect(mesocycleRepo.deleteWithChildren('meso-gone')).rejects.toThrow();
      return repos.sessionRepo.update({ ...session, status: 'in_progress' });
    });

    await expect(workoutStore.repos.sessionRepo.getById('session-1')).resolves.toEqual(updated);
    await expect(mesocycleRepo.getById('meso-a')).resolves.not.toBeNull();
    close();
  });
});
