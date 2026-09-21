import { toExerciseId, type Exercise } from '@domain/catalog';
import { EXERCISE_CATALOG } from '@domain/exerciseCatalog';
import type { Unsaved } from '@domain/timestamps';
import { migrateToLatest } from '@storage/sqlite/migrations';
import { createSqliteRepositories } from '@storage/sqlite/repositories';
import { sql } from 'drizzle-orm';

import { catalogUpsertSql } from '../../scripts/catalogMigration';
import { migratedTestDatabase, readMigrationBundle } from '../fixtures/sqliteDatabase';
import { withoutStamps } from '../fixtures/stamps';

// Task 067(2) · the exercise catalog ships as a migration rather than as a step at startup, so
// what has to hold is a property of the database after migrating, not of any runtime procedure.

function byId(exercises: readonly Unsaved<Exercise>[]): Unsaved<Exercise>[] {
  return [...exercises].sort((a, b) => a.id.localeCompare(b.id));
}

describe('the catalog the migrations put in the database', () => {
  test('is exactly the catalog this build ships', async () => {
    // Also the guard against editing `EXERCISE_CATALOG` and forgetting to generate a migration
    // for it: nothing else would notice until the exercise failed to appear on someone's phone.
    const { db, close } = await migratedTestDatabase();

    const stored = await createSqliteRepositories(db).exerciseRepo.getAll();

    expect(byId(withoutStamps(stored))).toEqual(byId(EXERCISE_CATALOG));
    close();
  });

  test('is not duplicated by migrating again', async () => {
    const { db, close } = await migratedTestDatabase();

    await migrateToLatest(db, readMigrationBundle());

    await expect(createSqliteRepositories(db).exerciseRepo.getAll()).resolves.toHaveLength(
      EXERCISE_CATALOG.length,
    );
    close();
  });
});

describe('a later release of the catalog', () => {
  const FIRST = EXERCISE_CATALOG[0]!;

  test('corrects the entries it ships and leaves the user’s own decisions alone', async () => {
    const { db, close } = await migratedTestDatabase();
    const { exerciseRepo } = createSqliteRepositories(db);
    const original = (await exerciseRepo.getById(FIRST.id))!;
    // The user hid a catalog exercise, and has an exercise of their own.
    await exerciseRepo.toggleHidden(FIRST.id);
    const custom = await exerciseRepo.createCustom({
      id: toExerciseId('my-own-curl'),
      name: 'My Own Curl',
      muscleGroup: 'biceps',
      source: 'custom',
      isHidden: false,
    });

    // The next release renames that exercise and fixes its muscle group.
    const corrected: Unsaved<Exercise> = {
      ...FIRST,
      name: 'Renamed Press',
      muscleGroup: 'shoulders',
    };
    await db.run(sql.raw(catalogUpsertSql([corrected], '2026-10-01T00:00:00.000Z')));

    const stored = (await exerciseRepo.getById(FIRST.id))!;
    expect(stored).toMatchObject({ name: 'Renamed Press', muscleGroup: 'shoulders' });
    // Hidden stays hidden, and the row keeps the moment it first arrived.
    expect(stored.isHidden).toBe(true);
    expect(stored.createdAt).toBe(original.createdAt);
    expect(stored.updatedAt).toBe('2026-10-01T00:00:00.000Z');
    await expect(exerciseRepo.getById(custom.id)).resolves.toEqual(custom);
    close();
  });

  test('adds what is new without touching what is already there', async () => {
    const { db, close } = await migratedTestDatabase();
    const { exerciseRepo } = createSqliteRepositories(db);
    const untouched = (await exerciseRepo.getById(FIRST.id))!;

    const added: Unsaved<Exercise> = {
      id: toExerciseId('sled-push'),
      name: 'Sled Push',
      muscleGroup: 'quads',
      source: 'catalog',
      equipment: 'other',
      isHidden: false,
    };
    await db.run(sql.raw(catalogUpsertSql([added], '2026-10-01T00:00:00.000Z')));

    expect(withoutStamps((await exerciseRepo.getById(added.id))!)).toEqual(added);
    await expect(exerciseRepo.getById(FIRST.id)).resolves.toEqual(untouched);
    await expect(exerciseRepo.getAll()).resolves.toHaveLength(EXERCISE_CATALOG.length + 1);
    close();
  });

  test('escapes an exercise whose name contains a quote', async () => {
    const { db, close } = await migratedTestDatabase();
    const { exerciseRepo } = createSqliteRepositories(db);

    const awkward: Unsaved<Exercise> = {
      id: toExerciseId('awkward'),
      name: "Zercher's ' Squat",
      muscleGroup: 'quads',
      source: 'catalog',
      isHidden: false,
    };
    await db.run(sql.raw(catalogUpsertSql([awkward], '2026-10-01T00:00:00.000Z')));

    expect(withoutStamps((await exerciseRepo.getById(awkward.id))!)).toEqual(awkward);
    close();
  });
});
