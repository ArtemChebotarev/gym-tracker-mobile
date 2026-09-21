// Composition root for the exercise-library use cases — see 08.6 · Библиотека упражнений.
// The domain/usecases/repositories/storage layers only define contracts and adapters; this is
// the wiring: which repositories of the set in context (state/repositories.tsx) each use case
// reads through. state/ owns this (not app/) because app/ must not import @storage or
// @repositories directly — see app/README.md and 07 · Persistence Layer Contract, rule 9.
//
// These are hooks rather than the plain functions of task 111: the set reaches a screen through
// the provider the gate renders (task 115), so reading it is `useContext` and everything that
// calls one of these is a hook itself. The narrow `Deps` objects below are unchanged — `usecases`
// and `domain` know nothing about React.
//
// The catalog used to be seeded from here on first read. It isn't any more: since 067(2) it
// reaches the database as migration `drizzle/0001_seed_catalog.sql`, so it is already there by
// the time any screen asks (task 112).

import { useRepositories } from '@state/repositories';
import type { ExerciseLibraryDeps } from '@usecases/exerciseLibrary';
import type { ExerciseHistoryDeps } from '@usecases/exerciseHistory';
import type { ExerciseOverviewDeps } from '@usecases/exerciseOverview';

export function useExerciseLibraryDeps(): ExerciseLibraryDeps {
  const { exerciseRepo, setLogRepo } = useRepositories();
  return { exerciseRepo, setLogRepo };
}

/** What the Exercise screen's History tab (108) reads — and the Overview tab's aggregates too. */
export function useExerciseHistoryDeps(): ExerciseHistoryDeps {
  const { exerciseHistoryRepo } = useRepositories();
  return { exerciseHistoryRepo };
}

/** What the Exercise screen's Overview tab (065) reads: the catalog, plus the exercise's history. */
export function useExerciseOverviewDeps(): ExerciseOverviewDeps {
  const { exerciseRepo, exerciseHistoryRepo } = useRepositories();
  return { exerciseRepo, exerciseHistoryRepo };
}
