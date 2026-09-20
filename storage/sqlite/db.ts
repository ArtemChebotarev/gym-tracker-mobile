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
 * Turns on foreign key enforcement for this connection — SQLite leaves it off by default, and
 * the schema's references would be decoration without it (decision of 2026-09-20, see
 * 09 · Open Questions & Decisions Log).
 */
export function enableForeignKeys(db: SqliteDatabase): void {
  db.run(sql`PRAGMA foreign_keys = ON`);
}
