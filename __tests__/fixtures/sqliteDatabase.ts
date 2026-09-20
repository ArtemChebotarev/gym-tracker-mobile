import { enableForeignKeys, type SqliteDatabase } from '@storage/sqlite/db';
import { migrateToLatest, type MigrationBundle } from '@storage/sqlite/migrations';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// A fresh SQLite database for a test, migrated exactly the way the app migrates its own.
//
// The driver is better-sqlite3 rather than the app's expo-sqlite, which is a native iOS/Android
// module that cannot load in Node (task 110). Everything above it — the schema, the migrations,
// the runner that applies them, the adapter — is the same code the phone runs; only the two
// lines that open the database differ.
//
// `:memory:` and built per test: nothing to clean up between tests, and so nothing to clean up
// by mistake. It costs a fraction of a millisecond.

const MIGRATIONS_DIR = join(__dirname, '../../drizzle');

/**
 * The app's real migrations, in the shape the bundler hands them to the app at runtime. Metro
 * builds this from `drizzle/migrations.js`; Node can read the same files off disk, so the tests
 * assemble it rather than importing a module full of `.sql` imports Jest would have to transform.
 */
export function readMigrationBundle(): MigrationBundle {
  const journal = JSON.parse(
    readFileSync(join(MIGRATIONS_DIR, 'meta/_journal.json'), 'utf8'),
  ) as MigrationBundle['journal'];
  const migrations = Object.fromEntries(
    journal.entries.map((entry) => [
      `m${entry.idx.toString().padStart(4, '0')}`,
      readFileSync(join(MIGRATIONS_DIR, `${entry.tag}.sql`), 'utf8'),
    ]),
  );
  return { journal, migrations };
}

export type TestDatabase = {
  db: SqliteDatabase;
  close(): void;
};

/** An empty in-memory database with foreign keys on and nothing migrated yet. */
export function openTestDatabase(): TestDatabase {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite);
  enableForeignKeys(db);
  return { db, close: () => sqlite.close() };
}

/** The same, brought up to the app's current schema. */
export async function migratedTestDatabase(): Promise<TestDatabase> {
  const database = openTestDatabase();
  await migrateToLatest(database.db, readMigrationBundle());
  return database;
}
