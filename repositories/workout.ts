import type { SessionRepository } from '@repositories/session';
import type { SessionExerciseRepository } from '@repositories/sessionExercise';
import type { SetLogRepository } from '@repositories/setLogRepository';
import type { TransactionalStore } from '@repositories/transaction';

/**
 * The repositories a workout-screen scenario (05 · Workout Execution & Logging) reads and writes
 * through: the session, its exercises, and their set logs.
 */
export type WorkoutRepositories = {
  sessionRepo: SessionRepository;
  sessionExerciseRepo: SessionExerciseRepository;
  setLogRepo: SetLogRepository;
};

/**
 * Workout repositories plus a way to run several writes atomically (07 · Persistence Layer
 * Contract, rule 6). Every change to an active session is persisted right away as one operation
 * (05, "Сохранение данных"), and most of them touch more than one record — a set log and its
 * session's status, a swapped exercise and the logs it drops — so they must land together or not
 * at all.
 *
 * `transaction` hands `work` repositories bound to the transaction; writes made through them are
 * all rolled back if `work` throws or rejects (see `TransactionalStore` for the full contract).
 * `repos` is for reads outside a transaction.
 */
export interface WorkoutStore extends TransactionalStore<WorkoutRepositories> {
  readonly repos: WorkoutRepositories;
}
