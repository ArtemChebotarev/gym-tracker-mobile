import { StorageUnavailableError } from '@domain/errors';
import { bootstrapStorage } from '@state/bootstrap';
import { repositories, setRepositories } from '@state/repositories';
import { createInMemoryRepositories } from '@storage/repositories';

// What task 111 asks of startup is an order: open the database, migrate it, and only then let
// anything read through it. Each step is mocked — the real ones need expo-sqlite, a native module
// Jest cannot load (task 110), and what each does is tested where it lives — so what is left to
// check here is exactly that order, and what is installed when a step fails.

const DB = { handle: 'db' };
const calls: string[] = [];

const mockOpenAppDatabase = jest.fn(() => {
  calls.push('open');
  return DB;
});
const mockMigrateToLatest = jest.fn(async (_db: unknown, _bundle: unknown) => {
  calls.push('migrate');
});

jest.mock('@storage/sqlite/expoDatabase', () => ({
  openAppDatabase: () => mockOpenAppDatabase(),
}));
jest.mock('@storage/sqlite/migrations', () => ({
  migrateToLatest: (db: unknown, bundle: unknown) => mockMigrateToLatest(db, bundle),
}));
jest.mock('@storage/sqlite/migrationBundle', () => ({
  MIGRATION_BUNDLE: { journal: { entries: [] }, migrations: {} },
}));
jest.mock('@storage/sqlite/repositories', () => ({
  createSqliteRepositories: (db: unknown) => ({ openedOver: db }),
}));

beforeEach(() => {
  calls.length = 0;
  setRepositories(null);
});

afterEach(() => {
  mockMigrateToLatest.mockClear();
  setRepositories(createInMemoryRepositories());
});

describe('bootstrapStorage', () => {
  test('migrates the database it opened, then installs repositories over that same handle', async () => {
    await bootstrapStorage();

    expect(calls).toEqual(['open', 'migrate']);
    expect(mockMigrateToLatest).toHaveBeenCalledWith(DB, expect.anything());
    expect(repositories()).toEqual({ openedOver: DB });
  });

  test('a failed migration installs nothing — no screen gets a half-migrated database', async () => {
    const failure = new StorageUnavailableError('The database is from the future.');
    mockMigrateToLatest.mockImplementationOnce(async () => {
      throw failure;
    });

    await expect(bootstrapStorage()).rejects.toBe(failure);
    expect(() => repositories()).toThrow();
  });
});
