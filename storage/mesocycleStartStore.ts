import type { MesocycleStartRepositories, MesocycleStartStore } from '@repositories/mesocycleStart';

import { InMemoryMesocycleRepository } from './mesocycle';
import { InMemorySessionRepository } from './session';
import { InMemorySessionExerciseRepository } from './sessionExercise';
import type { InMemoryStore } from './store';

function mesocycleStartRepositoriesOver(store: InMemoryStore): MesocycleStartRepositories {
  return {
    mesocycleRepo: new InMemoryMesocycleRepository(store),
    sessionRepo: new InMemorySessionRepository(store),
    sessionExerciseRepo: new InMemorySessionExerciseRepository(store),
  };
}

/**
 * The in-memory `MesocycleStartStore`: Start's repositories over `store`, with transactions
 * delegated to `InMemoryStore.transaction`. Same shape as `createInMemoryWorkoutStore` — the
 * repositories handed to `work` are built over the transaction's handle, not reused from `repos`.
 */
export function createInMemoryMesocycleStartStore(store: InMemoryStore): MesocycleStartStore {
  return {
    repos: mesocycleStartRepositoriesOver(store),
    transaction: (work) =>
      store.transaction((handle) => work(mesocycleStartRepositoriesOver(handle))),
  };
}
