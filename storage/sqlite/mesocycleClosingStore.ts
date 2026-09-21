import type {
  MesocycleClosingRepositories,
  MesocycleClosingStore,
} from '@repositories/mesocycleClosing';

import type { SqliteDatabase } from './db';
import { SqliteMesocycleRepository } from './mesocycle';
import { runInTransaction } from './transaction';
import { workoutRepositoriesOver } from './workoutStore';

function mesocycleClosingRepositoriesOver(db: SqliteDatabase): MesocycleClosingRepositories {
  return {
    ...workoutRepositoriesOver(db),
    mesocycleRepo: new SqliteMesocycleRepository(db),
  };
}

/**
 * The SQLite `MesocycleClosingStore`: closing's repositories over `db`, same shape as
 * `createSqliteWorkoutStore`. Stop writes the block's `abandoned` status together with the
 * sessions it ends (05, "Остановить мезоцикл"), so the two land together or not at all.
 */
export function createSqliteMesocycleClosingStore(db: SqliteDatabase): MesocycleClosingStore {
  return {
    repos: mesocycleClosingRepositoriesOver(db),
    transaction: (work) => runInTransaction(db, () => work(mesocycleClosingRepositoriesOver(db))),
  };
}
