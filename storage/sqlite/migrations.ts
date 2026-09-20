import { sql } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

import { StorageUnavailableError } from '../errors';
import type { SqliteDatabase } from './db';
import { runQuery, toDomainError } from './errors';

// Rule 7 of 07 · Persistence Layer Contract: the schema is versioned and migrations run at
// startup (task 069).
//
// The version is not a number anyone maintains by hand. `drizzle-kit generate` stamps every
// migration with the moment it was generated and records it in `drizzle/meta/_journal.json`;
// Drizzle's migrator keeps the stamps it has already applied in a `__drizzle_migrations` table
// inside the user's own database, and applies only what is newer than the latest of them. Those
// two — the bundled journal and that table — are the whole version system, and they cannot drift
// from what actually ran, which a hand-written number always eventually does (decision of
// 2026-09-20, see 09 · Open Questions & Decisions Log).

/**
 * The migrations as they reach the app: `drizzle/migrations.js`, which `drizzle-kit` generates
 * alongside the SQL so that a React Native bundler can carry them — Metro has no filesystem to
 * read them from at runtime.
 */
export type MigrationBundle = {
  journal: { entries: { idx: number; when: number; tag: string; breakpoints: boolean }[] };
  migrations: Record<string, string>;
};

/** Drizzle's own bookkeeping table. Created by the migrator on first run. */
const MIGRATIONS_TABLE = '__drizzle_migrations';

/** The newest migration this build carries, as its generation stamp. */
function newestInBundle(bundle: MigrationBundle): number {
  return bundle.journal.entries.reduce((newest, entry) => Math.max(newest, entry.when), 0);
}

/**
 * The newest migration this database has already had applied, or `null` when it has none — a
 * database this app has never opened, which is every database before the first run.
 */
async function newestInDatabase(db: SqliteDatabase): Promise<number | null> {
  const [table] = await runQuery(() =>
    db.values<[string]>(
      sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${MIGRATIONS_TABLE}`,
    ),
  );
  if (!table) {
    return null;
  }
  const [applied] = await runQuery(() =>
    db.values<[number | null]>(sql.raw(`SELECT MAX(created_at) FROM "${MIGRATIONS_TABLE}"`)),
  );
  return applied?.[0] ?? null;
}

/**
 * Refuses a database written by a newer build than this one — "отказ стартовать на версии из
 * будущего" (task 069). It happens to a real person: they install an update, use it, then roll
 * the app back. Their database now has columns this build has never heard of, and migrating
 * forward cannot help, because the migration that made them isn't in this bundle.
 *
 * Drizzle does not check this. Its migrator only ever asks "is anything newer than what ran?",
 * so against a future database it quietly applies nothing and hands back a schema the app will
 * then misread. Stopping is the only safe answer: the data is intact, and an older build has no
 * business touching it.
 */
async function assertNotFromTheFuture(db: SqliteDatabase, bundle: MigrationBundle): Promise<void> {
  const applied = await newestInDatabase(db);
  if (applied !== null && applied > newestInBundle(bundle)) {
    throw new StorageUnavailableError(
      'The database was written by a newer version of the app and cannot be opened by this one.',
    );
  }
}

/**
 * Brings `db` up to the schema this build expects, and resolves once it is safe to read from.
 * Applying nothing is the normal case: every launch after the first one.
 *
 * The work itself is Drizzle's own migrator, which wraps the whole run in a transaction — a
 * migration that fails halfway leaves the database as it was rather than half-migrated. The cast
 * is the one concession: Drizzle types the parameter as its expo-sqlite handle, while the
 * function body only ever touches the dialect and the session that every sync SQLite handle has.
 * That is what lets the migration path under Jest be the same code as the one on the phone,
 * rather than a stand-in for it (task 110).
 */
export async function migrateToLatest(db: SqliteDatabase, bundle: MigrationBundle): Promise<void> {
  await assertNotFromTheFuture(db, bundle);
  try {
    await migrate(db as unknown as ExpoSQLiteDatabase<Record<string, never>>, bundle);
  } catch (error) {
    // Rule 5 reaches this far too: a migration that fails is a database that cannot serve the
    // app, and what the caller gets to show for it is a domain error, not SQLite's wording.
    throw toDomainError(error);
  }
}
