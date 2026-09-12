// Composition root for the exercise-library use cases — see 08.6 · Библиотека упражнений.
// The domain/usecases/repositories/storage layers only define contracts and adapters; nothing
// wires a real store to a screen yet, because "Exercises — список" (task 063) is the first
// screen this app has fully connected end to end. This is that wiring: a single shared
// InMemoryStore, its Exercise/SetLog repositories, and the stub catalog (domain/exerciseCatalog)
// seeded into it once. state/ owns this (not app/) because app/ must not import @storage or
// @repositories directly — see app/README.md and 07 · Persistence Layer Contract, rule 9.

import { EXERCISE_CATALOG } from '@domain/exerciseCatalog';
import { InMemoryExerciseRepository } from '@storage/exerciseRepository';
import { InMemorySetLogRepository } from '@storage/setLogRepository';
import { InMemoryStore } from '@storage/store';
import type { ExerciseLibraryDeps } from '@usecases/exerciseLibrary';

// No catalog-versioning screen exists yet (that's Settings, see 02 · Domain Model), and the
// in-memory adapter's seedCatalog ignores this argument entirely — see storage/exerciseRepository.ts.
const CATALOG_VERSION = 1;

const store = new InMemoryStore();

export const exerciseLibraryDeps: ExerciseLibraryDeps = {
  exerciseRepo: new InMemoryExerciseRepository(store),
  setLogRepo: new InMemorySetLogRepository(store),
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
