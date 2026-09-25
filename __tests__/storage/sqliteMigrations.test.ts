import { isStorageUnavailableError } from '@domain/errors';
import { migrateToLatest, type MigrationBundle } from '@storage/sqlite/migrations';
import { sql } from 'drizzle-orm';

import { SqliteMesocycleRepository } from '@storage/sqlite/mesocycle';
import { SqliteSessionRepository } from '@storage/sqlite/session';
import { SqliteSessionExerciseRepository } from '@storage/sqlite/sessionExercise';
import { SqliteSetLogRepository } from '@storage/sqlite/setLogRepository';

import { defaultProgressionSettings } from '@domain/mesocycle';

import {
  makeSession,
  makeSessionExercise,
  makeSetLog,
} from '../contracts/fixtures';
import { openTestDatabase, readMigrationBundle } from '../fixtures/sqliteDatabase';

/** `bundle` as the build that shipped with its first `count` migrations carried it. */
function bundleUpTo(bundle: MigrationBundle, count: number): MigrationBundle {
  const entries = bundle.journal.entries.slice(0, count);
  return {
    journal: { entries },
    migrations: Object.fromEntries(
      entries.map((entry) => {
        const key = `m${entry.idx.toString().padStart(4, '0')}`;
        return [key, bundle.migrations[key]!];
      }),
    ),
  };
}

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

  /**
   * Every already-shipped migration's stamp, pinned. The `when` in the journal *is* the schema
   * version a database records for it, so changing one renames a migration that has already run:
   * the database's stamp no longer matches, the migrator calls it new, and it runs a second time
   * against a schema that already has it. `ALTER TABLE ... ADD COLUMN` then fails and the app
   * cannot open at all.
   *
   * That is not hypothetical — it happened on 25.09.2026, to 0002, by regenerating it to give the
   * file a better name. Drizzle stamps each `generate` with the moment it ran, so regenerating is
   * never a rename; it is a different migration with the same SQL. Once a migration has run
   * anywhere real, the only way to change anything about it is a new migration (AGENTS.md).
   *
   * Adding a migration means adding its line here. Changing a line means the change is wrong.
   */
  test('keep the stamps they have already run under — a shipped one is frozen', () => {
    const stamps = Object.fromEntries(
      readMigrationBundle().journal.entries.map((entry) => [entry.tag, entry.when]),
    );

    expect(stamps).toMatchObject({
      '0000_initial_schema': 1789936766954,
      '0001_seed_catalog': 1789938887567,
      '0002_mesocycle_archived_at': 1790351056868,
    });
  });

  /**
   * The case that actually matters, over the app's real migrations rather than invented ones: a
   * database with someone's training already in it, written by the build before this one, opened
   * by this one. Every row has to survive, and the new column has to arrive empty rather than
   * with something invented for the rows that predate it.
   *
   * Asked for directly on 25.09.2026, after a regenerated stamp broke exactly this path — the
   * phone holds the only copy of that data and there is no export yet (task 070).
   *
   * The mesocycle row goes in as the *old* build wrote it: column by column, without the one this
   * build adds. Today's adapter can neither write nor read that table before the migration runs —
   * it names `archived_at`, which is the column that isn't there yet — and a row it could handle
   * would not be the row the phone is holding. The other three tables this migration doesn't
   * touch, so today's adapter writes them exactly as yesterday's did.
   */
  test('carry a database full of training from the previous build into this one', async () => {
    const full = readMigrationBundle();
    const { db, close } = openTestDatabase();
    try {
      await migrateToLatest(db, bundleUpTo(full, full.journal.entries.length - 1));

      const mesocycleRepo = new SqliteMesocycleRepository(db);
      const sessionRepo = new SqliteSessionRepository(db);
      const sessionExerciseRepo = new SqliteSessionExerciseRepository(db);
      const setLogRepo = new SqliteSetLogRepository(db);
      // The catalog arrives as a migration, so the exercise a set log points at is already there.
      const [exerciseRow] = await db.values<[string]>(
        sql`SELECT id FROM exercise ORDER BY id LIMIT 1`,
      );
      const exerciseId = exerciseRow![0];
      await db.run(sql`
        INSERT INTO mesocycle
          (id, name, length_weeks, days_per_week, start_date, status, origin,
           progression_settings, completed_at, created_at, updated_at)
        VALUES
          ('meso-a', 'Push Pull Legs', 6, 3, '2026-01-05', 'completed', '{"type":"scratch"}',
           ${JSON.stringify(defaultProgressionSettings)}, '2026-02-20T10:00:00.000Z',
           '2026-01-05T10:00:00.000Z', '2026-02-20T10:00:00.000Z')
      `);
      await sessionRepo.create(makeSession({ id: 'session-1', mesoId: 'meso-a' }));
      await sessionExerciseRepo.create(
        makeSessionExercise({ id: 'se-1', sessionId: 'session-1', exerciseId }),
      );
      await setLogRepo.create(
        makeSetLog({ id: 'log-1', sessionExerciseId: 'se-1', exerciseId, weight: 82.5, reps: 9 }),
      );
      const before = {
        sessions: await sessionRepo.listByMesoId('meso-a'),
        exercises: await sessionExerciseRepo.listBySessionId('session-1'),
        logs: await setLogRepo.listBySessionId('session-1'),
      };

      await migrateToLatest(db, full);

      // The block is readable again, unchanged, and not archived: the new column arrives empty
      // rather than with something invented for a row that predates it.
      const [mesocycle] = await mesocycleRepo.getAll();
      expect(mesocycle).toMatchObject({
        id: 'meso-a',
        name: 'Push Pull Legs',
        lengthWeeks: 6,
        daysPerWeek: 3,
        status: 'completed',
        completedAt: '2026-02-20T10:00:00.000Z',
        createdAt: '2026-01-05T10:00:00.000Z',
      });
      expect(mesocycle?.archivedAt).toBeUndefined();

      // And the training under it is untouched, down to the weight and reps of the one set.
      expect(await sessionRepo.listByMesoId('meso-a')).toEqual(before.sessions);
      expect(await sessionExerciseRepo.listBySessionId('session-1')).toEqual(before.exercises);
      expect(await setLogRepo.listBySessionId('session-1')).toEqual(before.logs);
      expect(before.logs[0]).toMatchObject({ weight: 82.5, reps: 9 });

      // Opening the same database again applies nothing — the second launch after the update.
      await expect(migrateToLatest(db, full)).resolves.toBeUndefined();
    } finally {
      close();
    }
  });

  test('upgrade a database that stopped at an earlier one, without re-running what it has', async () => {
    const full = readMigrationBundle();
    const { db, close } = openTestDatabase();

    // Every prefix of the journal is a build that once shipped; each one has to be able to hand
    // its database over to the build after it.
    for (let count = 1; count <= full.journal.entries.length; count += 1) {
      await expect(migrateToLatest(db, bundleUpTo(full, count))).resolves.toBeUndefined();
    }
    close();
  });
});
