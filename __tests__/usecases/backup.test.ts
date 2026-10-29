import { BACKUP_KIND, BackupRefusedError } from '@domain/backup';
import { isConflictError } from '@domain/errors';
import type { SqliteDatabase } from '@storage/sqlite/db';
import { createSqliteBackupStore } from '@storage/sqlite/backupStore';
import {
  exportBackup,
  exportBackupJson,
  importBackup,
  importBackupJson,
  type BackupDeps,
} from '@usecases/backup';

import {
  makeCatalogExercise,
  makeCustomExercise,
  makeMesocycle,
  makeRoundLog,
  makeSession,
  makeSessionExercise,
  makeSetLog,
  makeTemplate,
} from '../contracts/fixtures';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

// A backup moves between two stores: it is exported from one and restored into another, which
// has to be empty for the restore to be allowed at all (task 070). So each test gets two
// databases, one per side of the trip — until task 118 the two came from two `new InMemoryStore()`.
const sourceDb = withTestDatabase();
const restoredDb = withTestDatabase();

// Task 070's DoD: a round trip through export and import reproduces the state exactly, and a file
// from another schema version is refused with something a screen can show.
//
// What the repositories underneath do is the repository contract's business (task 109); this is
// about the use case above them. `__tests__/storage/sqliteBackup.test.ts` is the adapter's own
// round trip, where JSON columns and nullable ones are what is under test.

const SCHEMA_VERSION = 1789938887567;

const HEAVY_BAG_SETTINGS = {
  'exercise-heavy-bag': {
    type: 'interval' as const,
    rounds: 2,
    workSec: 120,
    restSec: 45,
    getReadySec: 5,
    lever: 'rest' as const,
    stepSec: 10 as const,
  },
};

function makeDeps(database: () => SqliteDatabase): BackupDeps {
  return { store: createSqliteBackupStore(database()), schemaVersion: SCHEMA_VERSION };
}

/**
 * A store with one of everything, including a hidden catalog exercise and a custom one, and the
 * hybrid side of it: an interval exercise with the block's own settings for it, its rounds, and
 * Get ready and the signals changed from what ships (GT-72).
 */
async function fill(deps: BackupDeps): Promise<void> {
  const {
    exerciseRepo,
    templateRepo,
    mesocycleRepo,
    sessionRepo,
    sessionExerciseRepo,
    setLogRepo,
    roundLogRepo,
    settingsRepo,
  } = deps.store.repos;

  await exerciseRepo.seedCatalog([
    makeCatalogExercise('exercise-bench-press'),
    makeCatalogExercise('exercise-squat'),
    makeCatalogExercise('exercise-heavy-bag', { muscleGroup: 'fullBody', type: 'interval' }),
  ]);
  await exerciseRepo.toggleHidden(makeCatalogExercise('exercise-squat').id);
  await exerciseRepo.createCustom(makeCustomExercise('exercise-my-own'));
  await templateRepo.create(makeTemplate());
  await mesocycleRepo.create(makeMesocycle({ exerciseSettings: HEAVY_BAG_SETTINGS }));
  await sessionRepo.create(makeSession());
  await sessionExerciseRepo.create(makeSessionExercise());
  await setLogRepo.create(makeSetLog());
  await sessionExerciseRepo.create(
    makeSessionExercise({
      id: 'session-exercise-bag',
      exerciseId: 'exercise-heavy-bag',
      order: 2,
      setTargets: [
        { setNumber: 1, targetWorkSec: 120, targetRestSec: 45 },
        { setNumber: 2, targetWorkSec: 120, targetRestSec: 45 },
      ],
    }),
  );
  await roundLogRepo.create(
    makeRoundLog({ id: 'round-log-1', sessionExerciseId: 'session-exercise-bag', roundNumber: 1 }),
  );
  // The last round has no rest after it — the absent rest and the skipped flag both travel.
  const { restSec: _noRest, ...lastRound } = makeRoundLog({
    id: 'round-log-2',
    sessionExerciseId: 'session-exercise-bag',
    roundNumber: 2,
    restSkipped: true,
    completedAt: '2026-08-26T08:03:00.000Z',
  });
  await roundLogRepo.create(lastRound);
  await settingsRepo.write({
    ...(await settingsRepo.read()),
    weightUnit: 'lb',
    getReadySec: 10,
    signals: { sound: false, vibration: true },
    onboarding: {
      welcomeSeen: true,
      coachmarksSeen: true,
      deloadIntroSeen: false,
      startCycleSeen: false,
    },
  });
}

describe('exportBackup', () => {
  test('carries the version, the time and the empty owner slot', async () => {
    const deps = makeDeps(sourceDb);

    const file = await exportBackup(deps, '2026-09-21T12:00:00.000Z');

    expect(file.kind).toBe(BACKUP_KIND);
    expect(file.schemaVersion).toBe(SCHEMA_VERSION);
    expect(file.exportedAt).toBe('2026-09-21T12:00:00.000Z');
    // The slot a server fills once, giving the whole set an owner in one operation.
    expect(file.owner).toBeNull();
  });

  test('an untouched store exports as a file with nothing in it', async () => {
    const file = await exportBackup(makeDeps(sourceDb));

    expect(file.data.exercises).toEqual([]);
    expect(file.data.mesocycles).toEqual([]);
    expect(file.data.setLogs).toEqual([]);
    expect(file.data.roundLogs).toEqual([]);
  });
});

describe('export → import round trip', () => {
  test('a fresh store ends up holding exactly what the exported one held', async () => {
    const source = makeDeps(sourceDb);
    await fill(source);
    const exported = await exportBackup(source);

    const restored = makeDeps(restoredDb);
    await importBackup(exported, restored);

    await expect(exportBackup(restored, exported.exportedAt)).resolves.toEqual(exported);
  });

  test('interval rounds, the block\'s exercise settings and the hybrid settings come back', async () => {
    const source = makeDeps(sourceDb);
    await fill(source);
    const exported = await exportBackup(source);
    expect(exported.data.roundLogs.map((round) => round.id)).toEqual(['round-log-1', 'round-log-2']);

    const restored = makeDeps(restoredDb);
    await importBackup(exported, restored);

    const { roundLogRepo, mesocycleRepo, settingsRepo } = restored.store.repos;
    await expect(roundLogRepo.listBySessionExerciseId('session-exercise-bag')).resolves.toEqual(
      exported.data.roundLogs,
    );
    const [mesocycle] = await mesocycleRepo.getAll();
    expect(mesocycle!.exerciseSettings).toEqual(HEAVY_BAG_SETTINGS);
    const settings = await settingsRepo.read();
    expect(settings.getReadySec).toBe(10);
    expect(settings.signals).toEqual({ sound: false, vibration: true });
  });

  test('records keep the stamps they were written with, not the moment of the restore', async () => {
    const source = makeDeps(sourceDb);
    await fill(source);
    const exported = await exportBackup(source);

    const restored = makeDeps(restoredDb);
    await importBackup(exported, restored);

    const [mesocycle] = await restored.store.repos.mesocycleRepo.getAll();
    expect(mesocycle!.createdAt).toBe(exported.data.mesocycles[0]!.createdAt);
    expect(mesocycle!.updatedAt).toBe(exported.data.mesocycles[0]!.updatedAt);
  });

  test('a hidden catalog exercise comes back hidden', async () => {
    const source = makeDeps(sourceDb);
    await fill(source);
    const exported = await exportBackup(source);

    // The catalog arrives by migration on a real install, so the restore finds it already there
    // and visible — the file's `isHidden` is the only place that choice survives.
    const restored = makeDeps(restoredDb);
    await restored.store.repos.exerciseRepo.seedCatalog([
      makeCatalogExercise('exercise-bench-press'),
      makeCatalogExercise('exercise-squat'),
    ]);

    await importBackup(exported, restored);

    const squat = await restored.store.repos.exerciseRepo.getById(
      makeCatalogExercise('exercise-squat').id,
    );
    expect(squat!.isHidden).toBe(true);
  });

  test('a hidden catalog template comes back hidden, and the shipped one is not written twice', async () => {
    const source = makeDeps(sourceDb);
    await fill(source);
    const shipped = makeTemplate({ id: 'shipped-template', source: 'catalog' });
    await source.store.repos.templateRepo.create({ ...shipped, isHidden: true });
    const exported = await exportBackup(source);

    // A fresh install already holds the shipped template, visible, put there by the migration.
    const restored = makeDeps(restoredDb);
    await restored.store.repos.templateRepo.create(shipped);

    await importBackup(exported, restored);

    const stored = await restored.store.repos.templateRepo.getById('shipped-template');
    expect(stored!.isHidden).toBe(true);
  });

  test('survives the trip through text', async () => {
    const source = makeDeps(sourceDb);
    await fill(source);
    const json = await exportBackupJson(source);

    const restored = makeDeps(restoredDb);
    await importBackupJson(json, restored);

    await expect(exportBackupJson(restored, JSON.parse(json).exportedAt)).resolves.toBe(json);
  });
});

describe('importBackup refuses what it cannot restore', () => {
  test('a file from another schema version, naming both versions', async () => {
    const exported = await exportBackup(makeDeps(sourceDb));
    const older = { ...exported, schemaVersion: 1 };

    // A domain error, so a screen can tell "wrong file" from "storage is broken" (rule 5).
    const error: unknown = await importBackup(older, makeDeps(sourceDb)).catch(
      (reason: unknown) => reason,
    );

    expect(isConflictError(error)).toBe(true);
    expect((error as BackupRefusedError).reason).toBe('different-version');
    expect((error as Error).message).toMatch(
      /different version of the app \(1; this build reads 1789938887567\)/,
    );
  });

  test('a JSON that is not a backup at all', async () => {
    await expect(importBackup({ hello: 'world' }, makeDeps(sourceDb))).rejects.toMatchObject({
      reason: 'not-a-backup',
      message: 'This file is not a Hybro backup.',
    });
  });

  test('text that is not JSON', async () => {
    await expect(importBackupJson('not json', makeDeps(sourceDb))).rejects.toMatchObject({
      reason: 'not-json',
      message: 'This file is not valid JSON.',
    });
  });

  test('a backup with no data in it', async () => {
    const exported = await exportBackup(makeDeps(sourceDb));
    const hollow = { ...exported, data: null };

    await expect(importBackup(hollow, makeDeps(sourceDb))).rejects.toMatchObject({
      reason: 'no-data',
    });
  });

  test('a store that already holds data of the user’s', async () => {
    const source = makeDeps(sourceDb);
    await fill(source);
    const exported = await exportBackup(source);

    const error: unknown = await importBackup(exported, source).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(BackupRefusedError);
    expect((error as BackupRefusedError).reason).toBe('has-user-data');
  });

  test('a store that only holds the shipped catalog is fine', async () => {
    const source = makeDeps(sourceDb);
    await fill(source);
    const exported = await exportBackup(source);

    const restored = makeDeps(restoredDb);
    await restored.store.repos.exerciseRepo.seedCatalog([
      makeCatalogExercise('exercise-bench-press'),
    ]);

    await expect(importBackup(exported, restored)).resolves.toBeUndefined();
  });

  test('a refused restore leaves the store as it was', async () => {
    const source = makeDeps(sourceDb);
    await fill(source);
    const exported = await exportBackup(source);
    const before = await exportBackup(source, exported.exportedAt);

    await expect(importBackup(exported, source)).rejects.toThrow();

    await expect(exportBackup(source, exported.exportedAt)).resolves.toEqual(before);
  });
});
