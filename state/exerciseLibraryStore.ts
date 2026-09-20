// Composition root for the exercise-library use cases — see 08.6 · Библиотека упражнений.
// The domain/usecases/repositories/storage layers only define contracts and adapters; this is
// the wiring: Exercise/SetLog repositories over the app-wide store (state/appStore.ts), and the
// stub catalog (domain/exerciseCatalog) seeded into it once. state/ owns this (not app/) because
// app/ must not import @storage or @repositories directly — see app/README.md and 07 ·
// Persistence Layer Contract, rule 9.

import { EXERCISE_CATALOG } from '@domain/exerciseCatalog';
import { InMemoryExerciseHistoryRepository } from '@storage/exerciseHistory';
import { InMemoryExerciseRepository } from '@storage/exerciseRepository';
import { InMemorySetLogRepository } from '@storage/setLogRepository';
import type { ExerciseLibraryDeps } from '@usecases/exerciseLibrary';
import type { ExerciseHistoryDeps } from '@usecases/exerciseHistory';
import type { ExerciseOverviewDeps } from '@usecases/exerciseOverview';

import { appStore } from './appStore';

// No catalog-versioning screen exists yet (that's Settings, see 02 · Domain Model), and the
// in-memory adapter's seedCatalog ignores this argument entirely — see storage/exerciseRepository.ts.
const CATALOG_VERSION = 1;

export const exerciseLibraryDeps: ExerciseLibraryDeps = {
  exerciseRepo: new InMemoryExerciseRepository(appStore),
  setLogRepo: new InMemorySetLogRepository(appStore),
};

/** What the Exercise screen's History tab (108) reads — and the Overview tab's aggregates too. */
export const exerciseHistoryDeps: ExerciseHistoryDeps = {
  exerciseHistoryRepo: new InMemoryExerciseHistoryRepository(appStore),
};

/** What the Exercise screen's Overview tab (065) reads: the catalog, plus the exercise's history. */
export const exerciseOverviewDeps: ExerciseOverviewDeps = {
  exerciseRepo: exerciseLibraryDeps.exerciseRepo,
  exerciseHistoryRepo: exerciseHistoryDeps.exerciseHistoryRepo,
};

let seeded: Promise<void> | null = null;

/**
 * Seeds the stub catalog into the shared store. Idempotent and safe to call on every render —
 * the underlying `seedCatalog` only inserts exercises that aren't already present, and this
 * wrapper additionally makes sure the seeding work itself only ever runs once per app session.
 */
export function ensureExerciseCatalogSeeded(): Promise<void> {
  if (!seeded) {
    seeded = exerciseLibraryDeps.exerciseRepo.seedCatalog(CATALOG_VERSION, EXERCISE_CATALOG);
  }
  return seeded;
}
