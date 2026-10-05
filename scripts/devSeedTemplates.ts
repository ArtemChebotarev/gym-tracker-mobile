import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { EXERCISE_CATALOG } from '../domain/exerciseCatalog';
import { enableForeignKeys } from '../storage/sqlite/db';
import { DATABASE_NAME } from '../storage/sqlite/databaseName';
import { SqliteTemplateRepository } from '../storage/sqlite/template';
import { DEV_TEMPLATES } from './devTemplates';

// `npm run dev:seed-templates [--clean]` — writes the throwaway templates in scripts/devTemplates.ts
// into the app's database on the booted iOS simulator, so Flow B (story GT-2) can be built before
// the real catalog templates exist (GT-5).
//
// Simulator only, on purpose: it finds the database through `simctl`, which cannot reach a phone,
// and the phone's database holds real training data (AGENTS.md). It goes through the same
// `SqliteTemplateRepository` the app uses, so the rows are exactly what the app would write.
//
// It touches only rows whose id starts with `dev-`: running it again updates them in place,
// `--clean` deletes them. Nothing else in the database is read or changed. The app keeps what it
// has already loaded, so relaunch it to see the change.

const BUNDLE_ID = 'com.anonymous.gym-tracker-mobile';

// Where expo-sqlite keeps its databases inside an iOS app's data container.
const SQLITE_DIR = 'Documents/SQLite';

function simulatorDatabasePath(): string {
  let container: string;
  try {
    container = execFileSync(
      'xcrun',
      ['simctl', 'get_app_container', 'booted', BUNDLE_ID, 'data'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    ).trim();
  } catch {
    throw new Error(`No booted simulator has ${BUNDLE_ID} installed. Run \`npm run ios\` first.`);
  }
  const path = join(container, SQLITE_DIR, DATABASE_NAME);
  if (!existsSync(path)) {
    throw new Error(`${path} does not exist yet — open the app once so it creates its database.`);
  }
  return path;
}

/** Fails before writing anything if a template names an exercise the catalog doesn't have. */
function assertExercisesExist(): void {
  const known = new Set<string>(EXERCISE_CATALOG.map((exercise) => exercise.id));
  const unknown = DEV_TEMPLATES.flatMap((template) =>
    template.weekPlan.days.flatMap((day) =>
      day.exercises
        .filter((exercise) => !known.has(exercise.exerciseId))
        .map((exercise) => `${template.id}: ${exercise.exerciseId}`),
    ),
  );
  if (unknown.length > 0) {
    throw new Error(`Exercises missing from the catalog:\n  ${unknown.join('\n  ')}`);
  }
}

async function main(): Promise<void> {
  const clean = process.argv.includes('--clean');
  assertExercisesExist();

  const path = simulatorDatabasePath();
  const sqlite = new Database(path);
  try {
    const db = drizzle(sqlite);
    enableForeignKeys(db);
    const repo = new SqliteTemplateRepository(db);

    for (const template of DEV_TEMPLATES) {
      const existing = await repo.getById(template.id);
      if (clean) {
        if (existing) await repo.deleteById(template.id);
      } else if (existing) {
        await repo.update({ ...existing, ...template });
      } else {
        await repo.create(template);
      }
    }
  } finally {
    sqlite.close();
  }

  const verb = clean ? 'Removed' : 'Wrote';
  console.log(`${verb} ${DEV_TEMPLATES.length} dev templates in ${path}`);
  console.log('Relaunch the app to see the change.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
