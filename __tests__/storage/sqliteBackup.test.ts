import { createSqliteBackupStore } from '@storage/sqlite/backupStore';
import { bundleSchemaVersion } from '@storage/sqlite/migrations';
import { exportBackup, importBackup, type BackupDeps } from '@usecases/backup';

import {
  makeCustomExercise,
  makeMesocycle,
  makeSession,
  makeSessionExercise,
  makeSetLog,
  makeTemplate,
} from '../contracts/fixtures';
import { migratedTestDatabase, readMigrationBundle, type TestDatabase } from '../fixtures/sqliteDatabase';

// The round trip on the engine the app actually runs (task 070's DoD). The in-memory suite proves
// the use case's rules; this proves they survive the medium — `week_plan`, `origin` and
// `set_targets` are JSON columns, `startDate` and `rir` are nullable, and a value that round-trips
// through a Map need not round-trip through SQLite.
//
// The database is migrated exactly as the app migrates its own, so it starts with the shipped
// catalog in it — which is what a freshly installed app looks like when a restore happens.

const SCHEMA_VERSION = bundleSchemaVersion(readMigrationBundle());

const databases: TestDatabase[] = [];

async function freshDeps(): Promise<BackupDeps> {
  const database = await migratedTestDatabase();
  databases.push(database);
  return { store: createSqliteBackupStore(database.db), schemaVersion: SCHEMA_VERSION };
}

afterEach(() => {
  while (databases.length > 0) {
    databases.pop()!.close();
  }
});

describe('a backup round trip on SQLite', () => {
  test('reproduces the store exactly, catalog and all', async () => {
    const source = await freshDeps();
    const { exerciseRepo, templateRepo, mesocycleRepo, sessionRepo, sessionExerciseRepo, setLogRepo } =
      source.store.repos;
    // Foreign keys are on here (unlike the in-memory engine), so the session exercise and the set
    // log point at an exercise that really exists rather than the fixtures' default id.
    const exercise = await exerciseRepo.createCustom(makeCustomExercise('exercise-my-own'));
    await templateRepo.create(makeTemplate());
    await mesocycleRepo.create(makeMesocycle());
    await sessionRepo.create(makeSession());
    await sessionExerciseRepo.create(makeSessionExercise({ exerciseId: exercise.id }));
    await setLogRepo.create(makeSetLog({ exerciseId: exercise.id }));

    const exported = await exportBackup(source);
    const restored = await freshDeps();
    await importBackup(exported, restored);

    await expect(exportBackup(restored, exported.exportedAt)).resolves.toEqual(exported);
  });

  test('the version in the file is the newest migration this build carries', async () => {
    const file = await exportBackup(await freshDeps());

    expect(file.schemaVersion).toBe(SCHEMA_VERSION);
    expect(file.schemaVersion).toBeGreaterThan(0);
  });

  test('a failed restore rolls the database back to where it was', async () => {
    const source = await freshDeps();
    await source.store.repos.mesocycleRepo.create(makeMesocycle());
    await source.store.repos.sessionRepo.create(makeSession());
    const exported = await exportBackup(source);

    // A set log pointing at a session exercise that isn't in the file: the foreign key rejects it
    // partway through, after the mesocycle and the session have already been written.
    const broken = {
      ...exported,
      data: { ...exported.data, setLogs: [{ ...makeSetLog(), createdAt: exported.exportedAt, updatedAt: exported.exportedAt }] },
    };
    const target = await freshDeps();

    await expect(importBackup(broken, target)).rejects.toThrow();

    const after = await exportBackup(target, exported.exportedAt);
    expect(after.data.mesocycles).toEqual([]);
    expect(after.data.sessions).toEqual([]);
  });
});
