import { toExerciseId, type Exercise } from '@domain/catalog';
import { EXERCISE_CATALOG } from '@domain/exerciseCatalog';
import type { MesoTemplate } from '@domain/plan';
import { TEMPLATE_CATALOG } from '@domain/templateCatalog';
import type { Unsaved } from '@domain/timestamps';
import { migrateToLatest } from '@storage/sqlite/migrations';
import { createSqliteRepositories } from '@storage/sqlite/repositories';
import { sql } from 'drizzle-orm';

import {
  catalogMigrationSql,
  catalogUpsertSql,
  templateUpsertSql,
} from '../../scripts/catalogMigration';
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

describe('what a re-seed may overwrite on an exercise that is already there', () => {
  // `type` and `config` are the exercise's own state once it is in a database (a custom power
  // exercise carries the user's "No heavier available" in its config): a later release of the
  // catalog must not touch them (GT-81).
  test('is name, muscle group, equipment and the stamp — never type, config or isHidden', () => {
    const sql = catalogUpsertSql([EXERCISE_CATALOG[0]!], '2026-10-17T00:00:00.000Z');
    const update = sql.slice(sql.indexOf('DO UPDATE SET'));

    expect(update).toContain('`name` = excluded.`name`');
    expect(update).toContain('`equipment` = excluded.`equipment`');
    expect(update).not.toMatch(/`type`|`config`|`is_hidden`/);
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

// GT-5 · catalog templates travel the same way the exercises do: as rows in a migration, upserted,
// so a later release corrects or adds and never touches what the user decided.

function templatesById(templates: readonly Unsaved<MesoTemplate>[]): Unsaved<MesoTemplate>[] {
  return [...templates].sort((a, b) => a.id.localeCompare(b.id));
}

const FIRST_EXERCISE = EXERCISE_CATALOG[0]!;
const SECOND_EXERCISE = EXERCISE_CATALOG[1]!;

const SAMPLE: Unsaved<MesoTemplate> = {
  id: 'sample-template',
  name: 'Sample',
  source: 'catalog',
  description: 'Two short days',
  weekPlan: {
    days: [
      {
        dayNumber: 1,
        name: 'Day 1',
        exercises: [{ exerciseId: FIRST_EXERCISE.id, order: 1, sets: 3 }],
      },
      {
        dayNumber: 2,
        name: 'Day 2',
        exercises: [{ exerciseId: SECOND_EXERCISE.id, order: 1, sets: 2 }],
      },
    ],
  },
  isHidden: false,
};

const AT = '2026-10-01T00:00:00.000Z';

describe('the templates the migrations put in the database', () => {
  test('are exactly the templates this build ships', async () => {
    // The guard against editing `TEMPLATE_CATALOG` and forgetting to generate a migration for it.
    const { db, close } = await migratedTestDatabase();

    const stored = await createSqliteRepositories(db).templateRepo.getAll();

    expect(templatesById(withoutStamps(stored))).toEqual(templatesById(TEMPLATE_CATALOG));
    close();
  });

  test('refer only to exercises the catalog has, in a plan that is well formed', () => {
    const exerciseIds = new Set<string>(EXERCISE_CATALOG.map((exercise) => exercise.id));

    expect(new Set(TEMPLATE_CATALOG.map((template) => template.id)).size).toBe(
      TEMPLATE_CATALOG.length,
    );
    for (const template of TEMPLATE_CATALOG) {
      expect(template.source).toBe('catalog');
      expect(template.isHidden).toBe(false);
      template.weekPlan.days.forEach((day, index) => {
        expect(day.dayNumber).toBe(index + 1);
        expect(day.name).toBe(`Day ${day.dayNumber}`);
        expect(day.exercises.length).toBeGreaterThan(0);
        day.exercises.forEach((slot, position) => {
          expect(exerciseIds.has(slot.exerciseId)).toBe(true);
          expect(slot.order).toBe(position + 1);
          expect(slot.sets).toBeGreaterThanOrEqual(1);
        });
      });
    }
  });
});

describe('a later release of the templates', () => {
  test('adds a template and keeps it once however many times it runs', async () => {
    const { db, close } = await migratedTestDatabase();
    const { templateRepo } = createSqliteRepositories(db);
    const before = (await templateRepo.getAll()).length;

    await db.run(sql.raw(templateUpsertSql([SAMPLE], AT)));
    await db.run(sql.raw(templateUpsertSql([SAMPLE], AT)));

    expect(withoutStamps((await templateRepo.getById(SAMPLE.id))!)).toEqual(SAMPLE);
    await expect(templateRepo.getAll()).resolves.toHaveLength(before + 1);
    close();
  });

  test('corrects what it ships and leaves the user’s own decision alone', async () => {
    const { db, close } = await migratedTestDatabase();
    const { templateRepo } = createSqliteRepositories(db);
    await db.run(sql.raw(templateUpsertSql([SAMPLE], AT)));
    const original = (await templateRepo.getById(SAMPLE.id))!;
    // The user hid it.
    await templateRepo.update({ ...original, isHidden: true });

    const corrected: Unsaved<MesoTemplate> = {
      ...SAMPLE,
      name: 'Sample, revised',
      description: undefined,
      weekPlan: { days: [SAMPLE.weekPlan.days[0]!] },
    };
    await db.run(sql.raw(templateUpsertSql([corrected], '2026-11-01T00:00:00.000Z')));

    const stored = (await templateRepo.getById(SAMPLE.id))!;
    expect(stored).toMatchObject({ name: 'Sample, revised', weekPlan: corrected.weekPlan });
    expect(stored.description).toBeUndefined();
    expect(stored.isHidden).toBe(true);
    expect(stored.createdAt).toBe(original.createdAt);
    expect(stored.updatedAt).toBe('2026-11-01T00:00:00.000Z');
    close();
  });

  test('escapes a name that contains a quote', async () => {
    const { db, close } = await migratedTestDatabase();
    const { templateRepo } = createSqliteRepositories(db);
    const awkward: Unsaved<MesoTemplate> = { ...SAMPLE, id: 'awkward', name: "Anna's ' plan" };

    await db.run(sql.raw(templateUpsertSql([awkward], AT)));

    expect(withoutStamps((await templateRepo.getById(awkward.id))!)).toEqual(awkward);
    close();
  });

  test('ships with the exercises in one migration file, exercises first', async () => {
    const { db, close } = await migratedTestDatabase();
    const { exerciseRepo, templateRepo } = createSqliteRepositories(db);
    const added: Unsaved<Exercise> = {
      id: toExerciseId('sled-push'),
      name: 'Sled Push',
      muscleGroup: 'quads',
      source: 'catalog',
      equipment: 'other',
      isHidden: false,
    };
    const template: Unsaved<MesoTemplate> = {
      ...SAMPLE,
      id: 'sled-day',
      weekPlan: {
        days: [
          { dayNumber: 1, name: 'Day 1', exercises: [{ exerciseId: added.id, order: 1, sets: 3 }] },
        ],
      },
    };

    const file = catalogMigrationSql([added], [template], AT);
    // The migrator runs a file statement by statement, split at this marker.
    const statements = file.split('--> statement-breakpoint');
    expect(statements).toHaveLength(2);
    for (const statement of statements) {
      await db.run(sql.raw(statement));
    }

    expect(withoutStamps((await exerciseRepo.getById(added.id))!)).toEqual(added);
    expect(withoutStamps((await templateRepo.getById(template.id))!)).toEqual(template);
    close();
  });

  test('writes nothing for templates when a release has none', () => {
    expect(templateUpsertSql([], AT)).toBe('');
    expect(catalogMigrationSql([FIRST_EXERCISE], [], AT)).toBe(
      catalogUpsertSql([FIRST_EXERCISE], AT),
    );
  });
});
