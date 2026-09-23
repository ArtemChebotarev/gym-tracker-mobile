import type { ExerciseRepository } from '@repositories/catalog';
import type { MesocycleRepository } from '@repositories/mesocycle';
import type { SessionRepository } from '@repositories/session';
import type { SessionExerciseRepository } from '@repositories/sessionExercise';
import type { SetLogRepository } from '@repositories/setLogRepository';
import type { TransactionalStore } from '@repositories/transaction';

/**
 * The repositories Start (04 · Meso Creation Flows, "Запуск (Start)") works through: the
 * mesocycle it launches and week 1's sessions with their exercises, which it writes, plus the
 * two it only reads.
 *
 * Start reads history exactly once, and only for a `copyWeek` block: week 1's reps and weights
 * come from each exercise's reference performance (`setLogRepo`), and whether an exercise carries
 * a weight at all from its catalog entry (`exerciseRepo`, task 105). They sit here rather than
 * beside the store so the lookup shares the write's transaction — one snapshot, not two.
 */
export type MesocycleStartRepositories = {
  mesocycleRepo: MesocycleRepository;
  sessionRepo: SessionRepository;
  sessionExerciseRepo: SessionExerciseRepository;
  setLogRepo: SetLogRepository;
  exerciseRepo: ExerciseRepository;
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
export interface MesocycleStartStore extends TransactionalStore<MesocycleStartRepositories> {
  readonly repos: MesocycleStartRepositories;
}
