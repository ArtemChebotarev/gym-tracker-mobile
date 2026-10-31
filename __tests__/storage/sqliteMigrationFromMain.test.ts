import { sql } from 'drizzle-orm';

import { defaultProgressionSettings } from '@domain/mesocycle';
import type { SqliteDatabase } from '@storage/sqlite/db';
import { migrateToLatest } from '@storage/sqlite/migrations';
import { SqliteSessionRepository } from '@storage/sqlite/session';
import { SqliteSessionExerciseRepository } from '@storage/sqlite/sessionExercise';
import { SqliteSetLogRepository } from '@storage/sqlite/setLogRepository';
import { SqliteSettingsRepository } from '@storage/sqlite/settings';

import { makeSession, makeSessionExercise, makeSetLog } from '../contracts/fixtures';
import {
  bundleUpTo,
  migrationIndex,
  openTestDatabase,
  readMigrationBundle,
} from '../fixtures/sqliteDatabase';

// GT-73 · the update the phone will actually take: the database the main build filled, carried
// over every hybrid migration in one launch. This is the proof of a migration's safety that
// stands in for looking at the phone's database — which is never read or copied.
//
// The comparison is over whole tables, every column that existed before, row for row — not over
// the fields a test happened to think of — so a migration that rewrites, drops or loses anything
// the user made fails here, today's and any added later.

/**
 * The tables a catalog migration upserts into, reference data beside what the user made, with the
 * columns a release may correct on a catalog row (scripts/catalogMigration.ts).
 */
const CATALOG_CORRECTIONS: Record<string, readonly string[]> = {
  exercise: ['name', 'muscle_group', 'equipment', 'updated_at'],
  meso_template: ['name', 'description', 'week_plan', 'updated_at'],
};

/** Every table the app keeps, by name, with the columns it has right now. */
async function tableColumns(db: SqliteDatabase): Promise<Record<string, string[]>> {
  const tables = await db.values<[string]>(sql`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> '__drizzle_migrations'
    ORDER BY name
  `);
  const columns: Record<string, string[]> = {};
  for (const [table] of tables) {
    const rows = await db.values<[string]>(
      sql`SELECT name FROM pragma_table_info(${table}) ORDER BY cid`,
    );
    columns[table] = rows.map(([name]) => name);
  }
  return columns;
}

/** Every row of `table`, `columns` only, ordered by the first of them — the id. */
async function rowsOf(db: SqliteDatabase, table: string, columns: string[]): Promise<unknown[][]> {
  const list = columns.map((column) => `"${column}"`).join(', ');
  return db.values(sql.raw(`SELECT ${list} FROM "${table}" ORDER BY 1`));
}

/** The stamps of the migrations the database has recorded as applied, oldest first. */
async function appliedStamps(db: SqliteDatabase): Promise<number[]> {
  const rows = await db.values<[number]>(
    sql`SELECT created_at FROM __drizzle_migrations ORDER BY id`,
  );
  return rows.map(([stamp]) => Number(stamp));
}

/**
 * What a phone on the main build holds: the catalog the migrations put there, one exercise of the
 * user's own and one catalog exercise hidden, a template of the user's own and a catalog one
 * hidden, a finished and archived block, a running one with a finished workout and a planned one,
 * and settings changed from what ships.
 *
 * The tables the hybrid migrations change — exercise, mesocycle, settings — are written column by
 * column, as the main build wrote them: today's adapter names the columns they add and could not
 * write a row the phone is actually holding. Sessions, their exercises and set logs none of those
 * migrations touch, so today's adapter writes them exactly as the main build did.
 */
async function fillAsTheMainBuild(db: SqliteDatabase): Promise<void> {
  const at = '2026-09-01T07:00:00.000Z';
  await db.run(sql`
    INSERT INTO exercise
      (id, name, muscle_group, source, equipment, is_hidden, created_at, updated_at)
    VALUES ('my-landmine-press', 'Landmine Press', 'shoulders', 'custom', 'barbell', 0, ${at}, ${at})
  `);
  await db.run(sql`UPDATE exercise SET is_hidden = 1 WHERE id = 'bench-press-barbell'`);

  const weekPlan = JSON.stringify([
    { dayNumber: 1, slots: [{ exerciseId: 'bench-press-dumbbell', sets: 3 }] },
  ]);
  await db.run(sql`
    INSERT INTO meso_template
      (id, name, source, week_plan, is_hidden, description, created_at, updated_at)
    VALUES ('my-template', 'My Upper', 'custom', ${weekPlan}, 0, 'Mine', ${at}, ${at})
  `);
  await db.run(sql`
    UPDATE meso_template SET is_hidden = 1
    WHERE id = (SELECT id FROM meso_template WHERE source = 'catalog' ORDER BY id LIMIT 1)
  `);

  const progression = JSON.stringify(defaultProgressionSettings);
  await db.run(sql`
    INSERT INTO mesocycle
      (id, name, length_weeks, days_per_week, start_date, status, origin, progression_settings,
       body_weight, week_plan, completed_at, archived_at, created_at, updated_at)
    VALUES
      ('meso-done', 'Push Pull Legs', 6, 3, '2026-07-06', 'completed', '{"type":"scratch"}',
       ${progression}, 81.5, ${weekPlan}, '2026-08-16T10:00:00.000Z',
       '2026-08-20T10:00:00.000Z', '2026-07-06T07:00:00.000Z', '2026-08-20T10:00:00.000Z'),
      ('meso-now', 'Upper Lower', 4, 4, '2026-09-01', 'active',
       '{"type":"template","templateId":"my-template"}', ${progression}, NULL, ${weekPlan},
       NULL, NULL, ${at}, ${at})
  `);

  const sessionRepo = new SqliteSessionRepository(db);
  const sessionExerciseRepo = new SqliteSessionExerciseRepository(db);
  const setLogRepo = new SqliteSetLogRepository(db);
  await sessionRepo.create(
    makeSession({
      id: 'session-done',
      mesoId: 'meso-now',
      name: 'Upper A',
      status: 'completed',
      plannedDate: '2026-09-01',
      startedAt: '2026-09-01T07:05:00.000Z',
      completedAt: '2026-09-01T08:10:00.000Z',
    }),
  );
  await sessionRepo.create(
    makeSession({ id: 'session-next', mesoId: 'meso-now', dayNumber: 2, status: 'planned' }),
  );
  await sessionExerciseRepo.create(
    makeSessionExercise({
      id: 'se-press',
      sessionId: 'session-done',
      exerciseId: 'my-landmine-press',
      setTargets: [
        { setNumber: 1, targetReps: 10, suggestedWeight: 30 },
        { setNumber: 2, targetReps: 10, suggestedWeight: 30 },
      ],
      targetRir: 2,
      status: 'completed',
    }),
  );
  await sessionExerciseRepo.create(
    makeSessionExercise({
      id: 'se-bench',
      sessionId: 'session-done',
      exerciseId: 'bench-press-dumbbell',
      order: 2,
      status: 'skipped',
    }),
  );
  await setLogRepo.create(
    makeSetLog({
      id: 'log-1',
      sessionExerciseId: 'se-press',
      exerciseId: 'my-landmine-press',
      weight: 30,
      reps: 11,
      rir: 2,
      completedAt: '2026-09-01T07:20:00.000Z',
    }),
  );
  await setLogRepo.create(
    makeSetLog({
      id: 'log-2',
      sessionExerciseId: 'se-press',
      exerciseId: 'my-landmine-press',
      setNumber: 2,
      weight: 32.5,
      reps: 9,
      completedAt: '2026-09-01T07:24:00.000Z',
    }),
  );

  await db.run(sql`
    INSERT INTO settings (id, default_progression_settings, weight_unit, onboarding)
    VALUES (1, ${progression}, 'lb',
            '{"welcomeSeen":true,"coachmarksSeen":true,"deloadIntroSeen":true}')
  `);
}

describe('the main build’s database', () => {
  test('comes through every hybrid migration with everything the user made, untouched', async () => {
    const full = readMigrationBundle();
    const mainBuild = migrationIndex(full, '0006_hybrid_exercise_types');
    const { db, close } = openTestDatabase();
    try {
      await migrateToLatest(db, bundleUpTo(full, mainBuild));
      await fillAsTheMainBuild(db);
      const columns = await tableColumns(db);
      const before: Record<string, unknown[][]> = {};
      for (const [table, names] of Object.entries(columns)) {
        before[table] = await rowsOf(db, table, names);
      }
      const stampsBefore = await appliedStamps(db);

      await migrateToLatest(db, full);

      // Every table the main build had is still there, with every row and every value in it. The
      // catalog tables also take new rows and the corrections a release may make to the catalog's
      // own, and nothing else: `is_hidden` and the user's rows, stamps included, stay as they were.
      for (const [table, names] of Object.entries(columns)) {
        const corrected = CATALOG_CORRECTIONS[table];
        if (!corrected) {
          expect({ table, rows: await rowsOf(db, table, names) }).toEqual({
            table,
            rows: before[table],
          });
          continue;
        }
        const source = names.indexOf('source');
        const after = await rowsOf(db, table, names);
        const kept = (row: unknown[]) =>
          row.filter((_, column) => !corrected.includes(names[column]!));
        expect(after.filter((row) => row[source] === 'custom')).toEqual(
          before[table]!.filter((row) => row[source] === 'custom'),
        );
        expect(after.map(kept)).toEqual(expect.arrayContaining(before[table]!.map(kept)));
      }
      // Not a comparison of empty tables: the user's own rows are all in what was compared.
      for (const table of ['mesocycle', 'session', 'session_exercise', 'set_log', 'settings']) {
        expect(before[table]!.length).toBeGreaterThan(0);
      }

      // The journal keeps what it had and records each hybrid migration once, in order.
      expect(await appliedStamps(db)).toEqual([
        ...stampsBefore,
        ...full.journal.entries.slice(mainBuild).map((entry) => entry.when),
      ]);

      // What the new columns give the rows that predate them: every exercise — the user's own
      // too — a strength one with no config, no block given exercise settings it never had.
      const hybridIds = await db.values<[string]>(
        sql`SELECT id FROM exercise WHERE type <> 'strength' OR config IS NOT NULL`,
      );
      const predating = new Set(before.exercise!.map(([id]) => id));
      expect(hybridIds.filter(([id]) => predating.has(id))).toEqual([]);
      expect(
        await db.values<[number]>(
          sql`SELECT COUNT(*) FROM mesocycle WHERE exercise_settings IS NOT NULL`,
        ),
      ).toEqual([[0]]);

      // And the app reads it all back: the set logs as written, the settings as the user left them.
      expect(await new SqliteSetLogRepository(db).listBySessionId('session-done')).toEqual([
        expect.objectContaining({ id: 'log-1', weight: 30, reps: 11, rir: 2 }),
        expect.objectContaining({ id: 'log-2', weight: 32.5, reps: 9 }),
      ]);
      await expect(new SqliteSettingsRepository(db).read()).resolves.toMatchObject({
        weightUnit: 'lb',
        onboarding: { welcomeSeen: true, coachmarksSeen: true, deloadIntroSeen: true },
      });
    } finally {
      close();
    }
  });
});
