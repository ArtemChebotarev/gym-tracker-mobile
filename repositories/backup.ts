import type { ExerciseRepository } from '@repositories/catalog';
import type { MesocycleRepository } from '@repositories/mesocycle';
import type { SessionRepository } from '@repositories/session';
import type { SessionExerciseRepository } from '@repositories/sessionExercise';
import type { SetLogRepository } from '@repositories/setLogRepository';
import type { SettingsRepository } from '@repositories/settings';
import type { TemplateRepository } from '@repositories/template';
import type { TransactionalStore } from '@repositories/transaction';

/** Every repository a backup reads from and writes back into (task 070). */
export type BackupRepositories = {
  exerciseRepo: ExerciseRepository;
  templateRepo: TemplateRepository;
  mesocycleRepo: MesocycleRepository;
  sessionRepo: SessionRepository;
  sessionExerciseRepo: SessionExerciseRepository;
  setLogRepo: SetLogRepository;
  settingsRepo: SettingsRepository;
};

/**
 * Those repositories plus a way to run a whole restore atomically (07 · Persistence Layer
 * Contract, rule 6). A restore touches six collections that reference each other, and a half-
 * restored backup is worse than none: it looks like data. So it lands whole or not at all.
 *
 * Same shape as `WorkoutStore` and `MesocycleStartStore`: `transaction` hands `work` repositories
 * bound to the transaction, `repos` is for reads outside one — which is all an export needs.
 */
export interface BackupStore extends TransactionalStore<BackupRepositories> {
  readonly repos: BackupRepositories;
}
