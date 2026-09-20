import { createSqliteRepositories } from '@storage/sqlite/repositories';

import type { RepositorySet } from '../contracts/harness';
import { describeRepositoryContract } from '../contracts/repositoryContract';
import { migratedTestDatabase } from '../fixtures/sqliteDatabase';

// Puts the SQLite adapter through the shared repository contract (task 109) — the check task
// 067's DoD asks for: "весь набор тестов репозиториев проходит на новой реализации без
// изменений". The contract itself knows nothing about SQLite; everything this file knows that it
// doesn't is right here.
//
// The database comes up the way the app's does, migrations and all (task 069) — see
// `__tests__/fixtures/sqliteDatabase.ts` for what that means and why the driver differs.

type SqliteRepositories = RepositorySet & { close(): void };

async function createSqliteHarness(): Promise<SqliteRepositories> {
  const { db, close } = await migratedTestDatabase();
  return { ...createSqliteRepositories(db), close };
}

describeRepositoryContract('sqlite', {
  create: createSqliteHarness,
  destroy: async (repositories) => {
    (repositories as SqliteRepositories).close();
  },
});
