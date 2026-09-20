import { sql } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

/**
 * The database handle every SQLite repository takes, whichever driver produced it: expo-sqlite in
 * the app, better-sqlite3 in Jest (task 110). Both are synchronous Drizzle drivers, so the
 * repositories share one type and one body of query code — only the line that opens the database
 * differs between the two.
 */
export type SqliteDatabase = BaseSQLiteDatabase<'sync', unknown>;

/**
 * Runs Drizzle-generated migrations, in the order given, statement by statement. Drizzle marks
 * the boundaries itself; splitting on `;` would break the moment a default value or a check
 * constraint contains one.
 *
 * Deliberately plain: it applies whatever it is handed and records nothing. Tracking which
 * migrations a database has already seen, and refusing to open one from a newer schema, is task
 * 069 — on the device that is Drizzle's own `migrate()` over `drizzle/migrations.js`.
 */
export function applySchema(db: SqliteDatabase, migrations: readonly string[]): void {
  for (const migration of migrations) {
    for (const statement of migration.split('--> statement-breakpoint')) {
      const trimmed = statement.trim();
      if (trimmed.length > 0) {
        db.run(sql.raw(trimmed));
      }
    }
  }
}

/**
 * Turns on foreign key enforcement for this connection — SQLite leaves it off by default, and
 * the schema's references would be decoration without it (decision of 2026-09-20, see
 * 09 · Open Questions & Decisions Log).
 */
export function enableForeignKeys(db: SqliteDatabase): void {
  db.run(sql`PRAGMA foreign_keys = ON`);
}
