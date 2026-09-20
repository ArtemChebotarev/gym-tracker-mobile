import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Task 110 · proves the toolchain the storage tests will run on, before task 067 builds an
// adapter worth running on it: Drizzle over better-sqlite3, in Jest, on an in-memory database.
//
// On the device the app talks to SQLite through expo-sqlite, a native iOS/Android module that
// cannot load in Node — so tests drive the same engine through a Node binding instead. The
// schema, the queries and (later) the generated migrations are shared; only the line that opens
// the database differs between the two. What this file cannot prove is the native binding's own
// behaviour on a phone — that stays a manual check on the simulator (task 111).
//
// No special Jest environment turned out to be needed, which is worth writing down because the
// opposite was expected: jest-expo's "React Native environment" is `jest-environment-node` with
// React Native export conditions bolted on (@react-native/jest-preset/jest/react-native-env.js),
// so a native Node addon loads in it unchanged. The export conditions are the part to watch —
// they make a package that ships a `react-native` entry point resolve to that build instead of
// its Node one.

const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  status: text('status').notNull(),
});

const setLog = sqliteTable('set_log', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => session.id),
  reps: integer('reps').notNull(),
});

const SCHEMA = `
CREATE TABLE session (id TEXT PRIMARY KEY, status TEXT NOT NULL);
CREATE TABLE set_log (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES session(id),
  reps INTEGER NOT NULL
);
`;

// A fresh database per test, the way `RepositoryHarness.create` will do it (task 109). It costs
// a fraction of a millisecond on SQLite, and it means no test can be left holding another's
// rows — there is nothing to clean up and so nothing to clean up by mistake.
function createDatabase() {
  const sqlite = new Database(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');
  sqlite.exec(SCHEMA);
  return { sqlite, db: drizzle(sqlite) };
}

describe('Drizzle over better-sqlite3 in Jest', () => {
  test('round-trips a row through the typed schema', () => {
    const { db, sqlite } = createDatabase();

    db.insert(session).values({ id: 'session-1', status: 'planned' }).run();
    db.insert(setLog).values({ id: 'log-1', sessionId: 'session-1', reps: 8 }).run();

    expect(db.select().from(setLog).where(eq(setLog.sessionId, 'session-1')).all()).toEqual([
      { id: 'log-1', sessionId: 'session-1', reps: 8 },
    ]);
    sqlite.close();
  });

  test('rolls back every write of a transaction that throws', () => {
    const { db, sqlite } = createDatabase();
    db.insert(session).values({ id: 'session-1', status: 'planned' }).run();

    expect(() =>
      db.transaction((tx) => {
        tx.update(session).set({ status: 'in_progress' }).where(eq(session.id, 'session-1')).run();
        tx.insert(setLog).values({ id: 'log-1', sessionId: 'session-1', reps: 8 }).run();
        throw new Error('failure partway through');
      }),
    ).toThrow('failure partway through');

    expect(db.select().from(session).all()).toEqual([{ id: 'session-1', status: 'planned' }]);
    expect(db.select().from(setLog).all()).toEqual([]);
    sqlite.close();
  });

  test('enforces foreign keys, so a dangling reference cannot be written', () => {
    const { db, sqlite } = createDatabase();

    expect(() =>
      db.insert(setLog).values({ id: 'log-1', sessionId: 'session-gone', reps: 8 }).run(),
    ).toThrow(/FOREIGN KEY/i);
    sqlite.close();
  });

  test('starts from an empty database, whatever the test before it wrote', () => {
    const { db, sqlite } = createDatabase();

    expect(db.select().from(session).all()).toEqual([]);
    sqlite.close();
  });
});
