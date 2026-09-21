import type { RepositorySet } from '@repositories/repositorySet';

import { InMemoryExerciseHistoryRepository } from './exerciseHistory';
import { InMemoryExerciseRepository } from './exerciseRepository';
import { InMemoryMesocycleRepository } from './mesocycle';
import { createInMemoryMesocycleStartStore } from './mesocycleStartStore';
import { MuscleGroupCatalogRepository } from './muscleGroupRepository';
import { InMemorySessionRepository } from './session';
import { InMemorySessionExerciseRepository } from './sessionExercise';
import { InMemorySessionTreeRepository } from './sessionTree';
import { InMemorySetLogRepository } from './setLogRepository';
import { InMemorySettingsRepository } from './settings';
import { InMemoryStore } from './store';
import { InMemoryTemplateRepository } from './template';
import { createInMemoryWorkoutStore } from './workoutStore';

/**
 * Every repository of 07 · Persistence Layer Contract over one `InMemoryStore` — the in-memory
 * counterpart of `createSqliteRepositories`, and the same `RepositorySet` the app holds.
 *
 * They have to share the store: cross-entity operations (a mesocycle and its sessions written in
 * one transaction, a session tree read across three collections) only see each other's rows if
 * they do. `settingsRepo` is the exception — settings is a single document rather than a
 * collection, so it holds its own (see storage/settings.ts).
 *
 * Since task 111 the app runs on SQLite, and this engine is the test double: fast, with no native
 * module and no file on disk. Passing `store` is for a caller that needs to reach the collections
 * directly; the default gives a fresh, empty one.
 */
export function createInMemoryRepositories(
  store: InMemoryStore = new InMemoryStore(),
): RepositorySet {
  return {
    muscleGroupRepo: new MuscleGroupCatalogRepository(),
    exerciseRepo: new InMemoryExerciseRepository(store),
    mesocycleRepo: new InMemoryMesocycleRepository(store),
    sessionRepo: new InMemorySessionRepository(store),
    sessionExerciseRepo: new InMemorySessionExerciseRepository(store),
    setLogRepo: new InMemorySetLogRepository(store),
    settingsRepo: new InMemorySettingsRepository(),
    templateRepo: new InMemoryTemplateRepository(store),
    exerciseHistoryRepo: new InMemoryExerciseHistoryRepository(store),
    sessionTreeRepo: new InMemorySessionTreeRepository(store),
    workoutStore: createInMemoryWorkoutStore(store),
    mesocycleStartStore: createInMemoryMesocycleStartStore(store),
  };
}
