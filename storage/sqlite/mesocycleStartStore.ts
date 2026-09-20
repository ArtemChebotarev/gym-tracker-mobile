import type { MesocycleStartRepositories, MesocycleStartStore } from '@repositories/mesocycleStart';

import type { SqliteDatabase } from './db';
import { SqliteMesocycleRepository } from './mesocycle';
import { SqliteSessionRepository } from './session';
import { SqliteSessionExerciseRepository } from './sessionExercise';
import { runInTransaction } from './transaction';

function mesocycleStartRepositoriesOver(db: SqliteDatabase): MesocycleStartRepositories {
  return {
    mesocycleRepo: new SqliteMesocycleRepository(db),
    sessionRepo: new SqliteSessionRepository(db),
    sessionExerciseRepo: new SqliteSessionExerciseRepository(db),
  };
}

/**
 * The SQLite `MesocycleStartStore`: Start's repositories over `db`, same shape as
 * `createSqliteWorkoutStore`. An active mesocycle without week 1's sessions is an invalid state
 * (04 · Meso Creation Flows, "Запуск (Start)"), so the two land together or not at all.
 */
export function createSqliteMesocycleStartStore(db: SqliteDatabase): MesocycleStartStore {
  return {
    repos: mesocycleStartRepositoriesOver(db),
    transaction: (work) => runInTransaction(db, () => work(mesocycleStartRepositoriesOver(db))),
  };
}
