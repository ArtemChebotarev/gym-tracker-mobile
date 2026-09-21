import type { BackupRepositories, BackupStore } from '@repositories/backup';

import type { SqliteDatabase } from './db';
import { SqliteExerciseRepository } from './exerciseRepository';
import { SqliteMesocycleRepository } from './mesocycle';
import { SqliteSessionRepository } from './session';
import { SqliteSessionExerciseRepository } from './sessionExercise';
import { SqliteSetLogRepository } from './setLogRepository';
import { SqliteSettingsRepository } from './settings';
import { SqliteTemplateRepository } from './template';
import { runInTransaction } from './transaction';

function backupRepositoriesOver(db: SqliteDatabase): BackupRepositories {
  return {
    exerciseRepo: new SqliteExerciseRepository(db),
    templateRepo: new SqliteTemplateRepository(db),
    mesocycleRepo: new SqliteMesocycleRepository(db),
    sessionRepo: new SqliteSessionRepository(db),
    sessionExerciseRepo: new SqliteSessionExerciseRepository(db),
    setLogRepo: new SqliteSetLogRepository(db),
    settingsRepo: new SqliteSettingsRepository(db),
  };
}

/**
 * The SQLite `BackupStore` — same shape as `createSqliteMesocycleStartStore`. A restore is one
 * transaction: six collections that reference each other land together, or the database is left
 * exactly as it was.
 */
export function createSqliteBackupStore(db: SqliteDatabase): BackupStore {
  return {
    repos: backupRepositoriesOver(db),
    transaction: (work) => runInTransaction(db, () => work(backupRepositoriesOver(db))),
  };
}
