// Composition root for the exercise-library use cases — see 08.6 · Библиотека упражнений.
// The domain/usecases/repositories/storage layers only define contracts and adapters; this is
// the wiring: which repositories of the installed set (state/repositories.ts) each use case
// reads through. state/ owns this (not app/) because app/ must not import @storage or
// @repositories directly — see app/README.md and 07 · Persistence Layer Contract, rule 9.
//
// These are functions rather than the objects they used to be: the set is installed at startup
// by the bootstrap (task 111), while this module is evaluated when expo-router imports the
// routes, which is earlier. Called from a query or a mutation, they always run after the gate
// has let the screen mount.
//
// The catalog used to be seeded from here on first read. It isn't any more: since 067(2) it
// reaches the database as migration `drizzle/0001_seed_catalog.sql`, so it is already there by
// the time any screen asks (task 112).

import { repositories } from '@state/repositories';
import type { ExerciseLibraryDeps } from '@usecases/exerciseLibrary';
import type { ExerciseHistoryDeps } from '@usecases/exerciseHistory';
import type { ExerciseOverviewDeps } from '@usecases/exerciseOverview';

export function exerciseLibraryDeps(): ExerciseLibraryDeps {
  const { exerciseRepo, setLogRepo } = repositories();
  return { exerciseRepo, setLogRepo };
}

/** What the Exercise screen's History tab (108) reads — and the Overview tab's aggregates too. */
export function exerciseHistoryDeps(): ExerciseHistoryDeps {
  const { exerciseHistoryRepo } = repositories();
  return { exerciseHistoryRepo };
}

/** What the Exercise screen's Overview tab (065) reads: the catalog, plus the exercise's history. */
export function exerciseOverviewDeps(): ExerciseOverviewDeps {
  const { exerciseRepo, exerciseHistoryRepo } = repositories();
  return { exerciseRepo, exerciseHistoryRepo };
}
