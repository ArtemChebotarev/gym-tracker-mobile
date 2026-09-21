import type { BackupRepositories, BackupStore } from '@repositories/backup';

import { InMemoryExerciseRepository } from './exerciseRepository';
import { InMemoryMesocycleRepository } from './mesocycle';
import { InMemorySessionRepository } from './session';
import { InMemorySessionExerciseRepository } from './sessionExercise';
import { InMemorySetLogRepository } from './setLogRepository';
import { InMemorySettingsRepository } from './settings';
import type { InMemoryStore } from './store';
import { InMemoryTemplateRepository } from './template';

/**
 * Settings is a single document rather than a collection (storage/settings.ts), so it is not in
 * the store and cannot be rebuilt per transaction handle like the others. The same instance is
 * reused, which means a restore that fails after writing settings leaves those written — the one
 * part of a rollback this engine cannot do. It matters only in tests: the app restores on SQLite,
 * where settings are a row like any other and roll back with everything else.
 */
export function createInMemoryBackupStore(store: InMemoryStore): BackupStore {
  const settingsRepo = new InMemorySettingsRepository();
  const repositoriesOver = (handle: InMemoryStore): BackupRepositories => ({
    exerciseRepo: new InMemoryExerciseRepository(handle),
    templateRepo: new InMemoryTemplateRepository(handle),
    mesocycleRepo: new InMemoryMesocycleRepository(handle),
    sessionRepo: new InMemorySessionRepository(handle),
    sessionExerciseRepo: new InMemorySessionExerciseRepository(handle),
    setLogRepo: new InMemorySetLogRepository(handle),
    settingsRepo,
  });

  return {
    repos: repositoriesOver(store),
    transaction: (work) => store.transaction((handle) => work(repositoriesOver(handle))),
  };
}
