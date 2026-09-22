import type { MesocycleRepository } from '@repositories/mesocycle';
import type { WorkoutRepositories } from '@repositories/workout';
import type { TransactionalStore } from '@repositories/transaction';

/**
 * The repositories closing a mesocycle (052) writes through: the workout ones — Stop ends the
 * block's unfinished sessions and their exercises, and reads their set logs to tell a session that
 * was trained from one that wasn't — plus the mesocycle itself.
 *
 * Composed from `WorkoutRepositories` rather than re-listed: this is the same scenario one level
 * up, run from the workout screen's header menu (05, "Действия над мезоциклом с экрана
 * тренировки").
 */
export type MesocycleClosingRepositories = WorkoutRepositories & {
  mesocycleRepo: MesocycleRepository;
};

/**
 * Closing's repositories plus a way to run their writes atomically (07 · Persistence Layer
 * Contract, rule 6). Stop writes the block's new status together with the sessions it ends (05,
 * "Остановить мезоцикл"); an `abandoned` block still holding a session `in_progress` — which the
 * Today tab would then reopen — is an invalid state, so the two land together or not at all.
 *
 * `transaction` hands `work` repositories bound to the transaction; writes made through them are
 * all rolled back if `work` throws or rejects (see `TransactionalStore` for the full contract).
 * `repos` is for reads outside a transaction.
 */
export interface MesocycleClosingStore extends TransactionalStore<MesocycleClosingRepositories> {
  readonly repos: MesocycleClosingRepositories;
}
