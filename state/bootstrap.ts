// Task 111 · the single point where the app's storage comes up, and the moment it stopped being
// in-memory.
//
// Order matters and is the whole content of this file: the database file is opened, the
// migrations this build carries are applied to it — which is also what puts the exercise catalog
// there (067(2)) — and only then is the repository set handed to the rest of the app. Nothing may
// read storage in between: a screen that queried a half-migrated database would get an error, or
// worse, an answer. Since task 115 that is structural rather than a matter of ordering — the set
// is the bootstrap's return value, and a screen reads it through the provider the gate renders
// once it has one (components/StorageGate.tsx).
//
// The failure that matters is `StorageUnavailableError` (07 · Persistence Layer Contract, rule
// 5): a database that cannot be opened or migrated, or one written by a newer build of the app
// (069). It is not recoverable from inside the app, so the bootstrap does not try — it rejects,
// and the gate renders the error screen.

import type { RepositorySet } from '@repositories/repositorySet';
import { createSqliteRepositories } from '@storage/sqlite/repositories';
import { openAppDatabase } from '@storage/sqlite/expoDatabase';
import { MIGRATION_BUNDLE } from '@storage/sqlite/migrationBundle';
import { migrateToLatest } from '@storage/sqlite/migrations';

/**
 * Brings storage up. Resolves with the set every screen reads through; rejects with a domain
 * error when it cannot, leaving nothing for the gate to hand down.
 */
export async function bootstrapStorage(): Promise<RepositorySet> {
  const db = openAppDatabase();
  await migrateToLatest(db, MIGRATION_BUNDLE);
  return createSqliteRepositories(db);
}
