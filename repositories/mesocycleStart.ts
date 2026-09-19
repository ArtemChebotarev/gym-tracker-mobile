import type { MesocycleRepository } from '@repositories/mesocycle';
import type { SessionRepository } from '@repositories/session';
import type { SessionExerciseRepository } from '@repositories/sessionExercise';

/**
 * The repositories Start (04 · Meso Creation Flows, "Запуск (Start)") writes through: the
 * mesocycle it launches, and week 1's sessions with their exercises.
 */
export type MesocycleStartRepositories = {
  mesocycleRepo: MesocycleRepository;
  sessionRepo: SessionRepository;
  sessionExerciseRepo: SessionExerciseRepository;
};

/**
 * Start's repositories plus a way to run their writes atomically (07 · Persistence Layer Contract,
 * rule 6). "Атомарность обязательна" (04, "Запуск (Start)"): an active mesocycle without week 1's
 * sessions is an invalid state, so the mesocycle and its sessions land together or not at all.
 *
 * `transaction` hands `work` repositories bound to the transaction; writes made through them are
 * all rolled back if `work` throws or rejects (see `TransactionalStore` for the full contract).
 * `repos` is for reads outside a transaction.
 */
export interface MesocycleStartStore {
  readonly repos: MesocycleStartRepositories;
  transaction<T>(work: (repos: MesocycleStartRepositories) => Promise<T>): Promise<T>;
}
