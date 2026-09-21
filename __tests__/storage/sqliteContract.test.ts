import { createSqliteRepositories } from '@storage/sqlite/repositories';

import type { RepositorySet } from '../contracts/harness';
import { describeRepositoryContract } from '../contracts/repositoryContract';
import { emptyTestDatabase } from '../fixtures/sqliteDatabase';

// Puts the SQLite adapter through the shared repository contract (task 109) — the check task
// 067's DoD asks for: "весь набор тестов репозиториев проходит на новой реализации без
// изменений". The contract itself knows nothing about SQLite; everything this file knows that it
// doesn't is right here.
//
// The database comes up through the app's own migrations (task 069), then loses the content they
// ship with it — a contract states what an implementation does starting from nothing, and the
// exercise catalog is not nothing. See `__tests__/fixtures/sqliteDatabase.ts`.

type SqliteRepositories = RepositorySet & { close(): void };

async function createSqliteHarness(): Promise<SqliteRepositories> {
  const { db, close } = await emptyTestDatabase();
  return { ...createSqliteRepositories(db), close };
}

describeRepositoryContract('sqlite', {
  create: createSqliteHarness,
  destroy: async (repositories) => {
    (repositories as SqliteRepositories).close();
  },
});
