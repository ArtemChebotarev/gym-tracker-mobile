// What the app's storage holds by the time a screen sees it, put into the in-memory engine the
// tests run on (jest.setup.ts installs it).
//
// On a device both of these arrive differently. The catalog is already in the database: it ships
// as migration `drizzle/0001_seed_catalog.sql` (067(2)), applied by the bootstrap before any
// screen mounts. Mesocycles arrive because the user made them — nothing seeds any (task 112).
// A test that needs either says so here, rather than relying on a screen to seed it on first
// read, which is what the app used to do.
//
// Not a test file itself — see `testPathIgnorePatterns` in jest.config.js.

import { EXERCISE_CATALOG } from '@domain/exerciseCatalog';
import { repositories } from '@state/repositories';

import { buildMockMesocycles } from './mesocycleMocks';

/** The exercise catalog, as migration 0001 leaves it on a device. */
export function seedExerciseCatalog(): Promise<void> {
  return repositories().exerciseRepo.seedCatalog(EXERCISE_CATALOG);
}

/** The stub mesocycles of `mesocycleMocks.ts`: one planned, one completed. */
export async function seedMockMesocycles(now: Date = new Date()): Promise<void> {
  const { mesocycleRepo } = repositories();
  for (const mesocycle of buildMockMesocycles(now)) {
    await mesocycleRepo.create(mesocycle);
  }
}
