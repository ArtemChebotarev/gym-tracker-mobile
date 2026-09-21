import type { WorkoutRepositories, WorkoutStore } from '@repositories/workout';

import type { SqliteDatabase } from './db';
import { SqliteSessionRepository } from './session';
import { SqliteSessionExerciseRepository } from './sessionExercise';
import { SqliteSetLogRepository } from './setLogRepository';
import { runInTransaction } from './transaction';

/**
 * The workout repositories over `db` — exported for `createSqliteMesocycleClosingStore`, which is
 * the same set plus the mesocycle.
 */
export function workoutRepositoriesOver(db: SqliteDatabase): WorkoutRepositories {
  return {
    sessionRepo: new SqliteSessionRepository(db),
    sessionExerciseRepo: new SqliteSessionExerciseRepository(db),
    setLogRepo: new SqliteSetLogRepository(db),
  };
}

/**
 * The SQLite `WorkoutStore`: workout repositories over `db`, with atomicity from SQLite's own
 * transactions (`runInTransaction`).
 *
 * The repositories handed to `work` are built fresh rather than reused from `repos` — they are
 * the same objects in effect, because a transaction here runs on the one connection the whole
 * adapter shares, but the shape keeps a future adapter with a real per-transaction handle from
 * having to change every call site.
 */
export function createSqliteWorkoutStore(db: SqliteDatabase): WorkoutStore {
  return {
    repos: workoutRepositoriesOver(db),
    transaction: (work) => runInTransaction(db, () => work(workoutRepositoriesOver(db))),
  };
}
