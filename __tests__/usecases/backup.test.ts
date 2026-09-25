import { BACKUP_KIND } from '@domain/backup';
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

function makeDeps(database: () => SqliteDatabase): BackupDeps {
  return { store: createSqliteBackupStore(database()), schemaVersion: SCHEMA_VERSION };
}

/** A store with one of everything, including a hidden catalog exercise and a custom one. */
async function fill(deps: BackupDeps): Promise<void> {
  const {
    exerciseRepo,
    templateRepo,
    mesocycleRepo,
    sessionRepo,
    sessionExerciseRepo,
    setLogRepo,
    settingsRepo,
  } = deps.store.repos;

  await exerciseRepo.seedCatalog([
    makeCatalogExercise('exercise-bench-press'),
    makeCatalogExercise('exercise-squat'),
  ]);
  await exerciseRepo.toggleHidden(makeCatalogExercise('exercise-squat').id);
  await exerciseRepo.createCustom(makeCustomExercise('exercise-my-own'));
  await templateRepo.create(makeTemplate());
  await mesocycleRepo.create(makeMesocycle());
  await sessionRepo.create(makeSession());
  await sessionExerciseRepo.create(makeSessionExercise());
  await setLogRepo.create(makeSetLog());
  await settingsRepo.write({
    defaultProgressionSettings: (await settingsRepo.read()).defaultProgressionSettings,
    weightUnit: 'lb',
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
    const error: unknown = await importBackup(older, makeDeps(sourceDb)).catch((reason: unknown) => reason);

    expect(isConflictError(error)).toBe(true);
    expect((error as Error).message).toMatch(
      /different version of the app \(1; this build reads 1789938887567\)/,
    );
  });

  test('a JSON that is not a backup at all', async () => {
    await expect(importBackup({ hello: 'world' }, makeDeps(sourceDb))).rejects.toThrow(
      'This file is not a Hybro backup.',
    );
  });

  test('text that is not JSON', async () => {
    await expect(importBackupJson('not json', makeDeps(sourceDb))).rejects.toThrow(
      'This file is not valid JSON.',
    );
  });

  test('a store that already holds data of the user’s', async () => {
    const source = makeDeps(sourceDb);
    await fill(source);
    const exported = await exportBackup(source);

    await expect(importBackup(exported, source)).rejects.toThrow(/no data of your own/);
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
