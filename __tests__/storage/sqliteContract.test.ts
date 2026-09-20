import { createSqliteRepositories } from '@storage/sqlite/repositories';
import { applySchema, enableForeignKeys } from '@storage/sqlite/db';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import journal from '../../drizzle/meta/_journal.json';
import type { RepositorySet } from '../contracts/harness';
import { describeRepositoryContract } from '../contracts/repositoryContract';

// Puts the SQLite adapter through the shared repository contract (task 109) — the check task
// 067's DoD asks for: "весь набор тестов репозиториев проходит на новой реализации без
// изменений". The contract itself knows nothing about SQLite; everything this file knows that it
// doesn't is right here.
//
// The database is `:memory:` and built fresh per test (`RepositoryHarness.create`), so no test
// can be left holding another's rows — there is nothing to clean up and so nothing to clean up by
// mistake. It costs a fraction of a millisecond.
//
// The driver is better-sqlite3 rather than the app's expo-sqlite, which is a native iOS/Android
// module that cannot load in Node (task 110). Same engine, same schema, same migrations, same
// adapter code — only the two lines that open the database differ from the app's.

const MIGRATIONS = (journal.entries as { tag: string }[]).map(({ tag }) =>
  readFileSync(join(__dirname, '../../drizzle', `${tag}.sql`), 'utf8'),
);

type SqliteRepositories = RepositorySet & { close(): void };

function createSqliteHarness(): SqliteRepositories {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite);
  enableForeignKeys(db);
  applySchema(db, MIGRATIONS);

  return { ...createSqliteRepositories(db), close: () => sqlite.close() };
}

describeRepositoryContract('sqlite', {
  create: async () => createSqliteHarness(),
  destroy: async (repositories) => {
    (repositories as SqliteRepositories).close();
  },
});
