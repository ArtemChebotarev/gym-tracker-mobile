import type { RepositorySet } from '@repositories/repositorySet';

import { MuscleGroupCatalogRepository } from '../muscleGroupRepository';
import type { SqliteDatabase } from './db';
import { SqliteExerciseHistoryRepository } from './exerciseHistory';
import { SqliteExerciseRepository } from './exerciseRepository';
import { SqliteMesocycleRepository } from './mesocycle';
import { createSqliteMesocycleStartStore } from './mesocycleStartStore';
import { SqliteSessionRepository } from './session';
import { SqliteSessionExerciseRepository } from './sessionExercise';
import { SqliteSessionTreeRepository } from './sessionTree';
import { SqliteSetLogRepository } from './setLogRepository';
import { SqliteSettingsRepository } from './settings';
import { SqliteTemplateRepository } from './template';
import { createSqliteWorkoutStore } from './workoutStore';

/**
 * Every repository of 07 · Persistence Layer Contract over one database handle — the SQLite
 * counterpart of wiring the in-memory repositories to one `InMemoryStore`. They have to share it:
 * mesocycles, sessions, session exercises and set logs reference each other by id, and a cascade
 * or a join only sees the other's rows if it is looking at the same database.
 *
 * `db` is whichever synchronous Drizzle handle the caller opened — expo-sqlite in the app, in
 * a database that lives in the app's document directory; better-sqlite3 in Jest, in `:memory:`.
 * Turning on foreign keys and applying the schema is the opener's job (see `db.ts`), because it
 * happens once per connection rather than once per repository.
 *
 * `MuscleGroupCatalogRepository` is the in-memory one and not a copy of it: the muscle groups are
 * a fixed enum in the domain (02 · Domain Model), so there is nothing stored for an engine to
 * differ about.
 */
export function createSqliteRepositories(db: SqliteDatabase): RepositorySet {
  return {
    muscleGroupRepo: new MuscleGroupCatalogRepository(),
    exerciseRepo: new SqliteExerciseRepository(db),
    mesocycleRepo: new SqliteMesocycleRepository(db),
    sessionRepo: new SqliteSessionRepository(db),
    sessionExerciseRepo: new SqliteSessionExerciseRepository(db),
    setLogRepo: new SqliteSetLogRepository(db),
    settingsRepo: new SqliteSettingsRepository(db),
    templateRepo: new SqliteTemplateRepository(db),
    exerciseHistoryRepo: new SqliteExerciseHistoryRepository(db),
    sessionTreeRepo: new SqliteSessionTreeRepository(db),
    workoutStore: createSqliteWorkoutStore(db),
    mesocycleStartStore: createSqliteMesocycleStartStore(db),
  };
}
