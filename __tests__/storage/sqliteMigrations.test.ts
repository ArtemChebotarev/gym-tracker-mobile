import { isStorageUnavailableError } from '@domain/errors';
import { migrateToLatest, type MigrationBundle } from '@storage/sqlite/migrations';
import { sql } from 'drizzle-orm';

import { openTestDatabase, readMigrationBundle } from '../fixtures/sqliteDatabase';

// Task 069 · the schema is versioned and migrations run at startup (07 · Persistence Layer
// Contract, rule 7).
//
// Most of these run on migrations invented here rather than on the app's own. The app has a
// single migration — the one that creates every table — so its own bundle can only ever show
// "applied to an empty database". What matters is the case it cannot show: a database that
// already holds someone's training, and an update that changes the schema under it. A pair of
// throwaway migrations exercises exactly that, through the same runner, and goes on doing so
// whatever happens to the app's real schema later.

/** A bundle in the shape the bundler hands the app, from migrations written inline. */
function bundleOf(...statements: string[]): MigrationBundle {
  return {
    journal: {
      entries: statements.map((_, idx) => ({
        idx,
        // The generation stamp is the version: the migrator applies what is newer than the
        // newest one the database has already seen.
        when: 1_700_000_000_000 + idx,
        tag: `${idx.toString().padStart(4, '0')}_test`,
        breakpoints: true,
      })),
    },
    migrations: Object.fromEntries(
      statements.map((statement, idx) => [`m${idx.toString().padStart(4, '0')}`, statement]),
    ),
  };
}

const CREATE_NOTES = 'CREATE TABLE note (id TEXT PRIMARY KEY, body TEXT NOT NULL);';
const ADD_PINNED = 'ALTER TABLE note ADD COLUMN pinned INTEGER;';

const VERSION_1 = bundleOf(CREATE_NOTES);
const VERSION_2 = bundleOf(CREATE_NOTES, ADD_PINNED);

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject.');
}

describe('migrating a database that already holds data', () => {
  test('an update to the next version keeps every row and adds the new column', async () => {
    const { db, close } = openTestDatabase();
    await migrateToLatest(db, VERSION_1);
    await db.run(sql`INSERT INTO note (id, body) VALUES ('note-1', 'squat 100x5')`);

    await migrateToLatest(db, VERSION_2);

    expect(await db.values<[string, string, number | null]>(sql`SELECT * FROM note`)).toEqual([
      ['note-1', 'squat 100x5', null],
    ]);
    close();
  });

  test('running the same version again applies nothing and touches nothing', async () => {
    const { db, close } = openTestDatabase();
    await migrateToLatest(db, VERSION_2);
    await db.run(sql`INSERT INTO note (id, body, pinned) VALUES ('note-1', 'bench 80x8', 1)`);

    await migrateToLatest(db, VERSION_2);
    await migrateToLatest(db, VERSION_2);

    expect(await db.values<[string, string, number | null]>(sql`SELECT * FROM note`)).toEqual([
      ['note-1', 'bench 80x8', 1],
    ]);
    close();
  });

  test('a migration that fails partway leaves the database as it was', async () => {
    const { db, close } = openTestDatabase();
    await migrateToLatest(db, VERSION_1);
    await db.run(sql`INSERT INTO note (id, body) VALUES ('note-1', 'deadlift 140x3')`);
    const broken = bundleOf(CREATE_NOTES, `${ADD_PINNED} DROP TABLE nothing_of_the_sort;`);

    const error = await rejectionOf(migrateToLatest(db, broken));

    // Rule 5: what comes out is a domain error, not the driver's own.
    expect(isStorageUnavailableError(error)).toBe(true);
    // The column the failed migration was adding is gone along with the rest of it, and the row
    // it was migrating is untouched.
    expect(await db.values<[string, string]>(sql`SELECT * FROM note`)).toEqual([
      ['note-1', 'deadlift 140x3'],
    ]);
    close();
  });
});

describe('a database from the future', () => {
  test('is refused rather than opened, and is left alone', async () => {
    // The user updated the app, used it, then rolled back to this build.
    const { db, close } = openTestDatabase();
    await migrateToLatest(db, VERSION_2);
    await db.run(sql`INSERT INTO note (id, body, pinned) VALUES ('note-1', 'row 60x10', 1)`);

    const error = await rejectionOf(migrateToLatest(db, VERSION_1));

    expect(isStorageUnavailableError(error)).toBe(true);
    expect((error as Error).message).toMatch(/newer version of the app/i);
    expect(await db.values<[string, string, number | null]>(sql`SELECT * FROM note`)).toEqual([
      ['note-1', 'row 60x10', 1],
    ]);
    close();
  });

  test('an empty database is not one — it is simply new', async () => {
    const { db, close } = openTestDatabase();

    await expect(migrateToLatest(db, VERSION_2)).resolves.toBeUndefined();
    close();
  });
});

describe('the app’s own migrations', () => {
  test('bring an empty database up to every table the adapter reads and writes', async () => {
    const { db, close } = openTestDatabase();

    await migrateToLatest(db, readMigrationBundle());

    // SQLite's own tables and Drizzle's bookkeeping one are filtered out here rather than in the
    // query: LIKE's escape clause and a JavaScript template literal do not get along.
    const tables = (
      await db.values<[string]>(sql`SELECT name FROM sqlite_master WHERE type = 'table'`)
    )
      .map(([name]) => name)
      .filter((name) => !name.startsWith('sqlite_') && !name.startsWith('__'))
      .sort();
    expect(tables).toEqual([
      'exercise',
      'meso_template',
      'mesocycle',
      'session',
      'session_exercise',
      'set_log',
      'settings',
    ]);
    close();
  });

  test('applied a second time do nothing, the way every launch after the first one does', async () => {
    const { db, close } = openTestDatabase();
    const bundle = readMigrationBundle();
    await migrateToLatest(db, bundle);

    await expect(migrateToLatest(db, bundle)).resolves.toBeUndefined();
    close();
  });
});
