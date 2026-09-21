import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

import { enableForeignKeys, type SqliteDatabase } from './db';

/**
 * The name of the app's database file, inside the app's own sandboxed documents directory —
 * expo-sqlite puts it there, and the OS backs it up and deletes it with the app. Naming it here
 * rather than at the call site keeps it out of the bootstrap's business: a rename would be a data
 * migration, not a startup detail.
 */
export const DATABASE_NAME = 'gymtracker.db';

/**
 * Opens the app's database. This is the one line that differs between running on a phone and
 * running under Jest, where `better-sqlite3` opens `:memory:` instead (task 110) — everything
 * past it, the repositories and the migrations, is the same code.
 *
 * `openDatabaseSync` is the synchronous opener on purpose: every repository takes a synchronous
 * Drizzle handle (see `db.ts`), and the asynchronous part of startup is the migrations, not this.
 * Foreign keys are turned on here because that is a property of the connection, not of a
 * repository — see `enableForeignKeys`.
 *
 * Importing this module pulls in a native module, so nothing that has to run under Jest may
 * import it. The bootstrap does, and tests mock the bootstrap.
 */
export function openAppDatabase(name: string = DATABASE_NAME): SqliteDatabase {
  const db = drizzle(SQLite.openDatabaseSync(name));
  enableForeignKeys(db);
  return db;
}
