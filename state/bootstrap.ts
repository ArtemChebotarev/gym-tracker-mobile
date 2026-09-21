// Task 111 · the single point where the app's storage comes up, and the moment it stopped being
// in-memory.
//
// Order matters and is the whole content of this file: the database file is opened, the
// migrations this build carries are applied to it — which is also what puts the exercise catalog
// there (067(2)) — and only then is the repository set installed for the rest of the app to read
// through. Nothing may read storage in between: a screen that queried a half-migrated database
// would get an error, or worse, an answer.
//
// The failure that matters is `StorageUnavailableError` (07 · Persistence Layer Contract, rule
// 5): a database that cannot be opened or migrated, or one written by a newer build of the app
// (069). It is not recoverable from inside the app, so the bootstrap does not try — it rejects,
// and the gate renders the error screen (components/StorageGate.tsx).

import { createSqliteRepositories } from '@storage/sqlite/repositories';
import { openAppDatabase } from '@storage/sqlite/expoDatabase';
import { MIGRATION_BUNDLE } from '@storage/sqlite/migrationBundle';
import { migrateToLatest } from '@storage/sqlite/migrations';

import { setRepositories } from './repositories';

/**
 * Brings storage up and installs it. Resolves once every screen may read; rejects with a domain
 * error when it cannot, leaving nothing installed.
 */
export async function bootstrapStorage(): Promise<void> {
  const db = openAppDatabase();
  await migrateToLatest(db, MIGRATION_BUNDLE);
  setRepositories(createSqliteRepositories(db));
}
