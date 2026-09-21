import type {
  MesocycleClosingRepositories,
  MesocycleClosingStore,
} from '@repositories/mesocycleClosing';

import { InMemoryMesocycleRepository } from './mesocycle';
import type { InMemoryStore } from './store';
import { workoutRepositoriesOver } from './workoutStore';

function mesocycleClosingRepositoriesOver(store: InMemoryStore): MesocycleClosingRepositories {
  return {
    ...workoutRepositoriesOver(store),
    mesocycleRepo: new InMemoryMesocycleRepository(store),
  };
}

/**
 * The in-memory `MesocycleClosingStore`: closing's repositories over `store`, with transactions
 * delegated to `InMemoryStore.transaction`. Same shape as `createInMemoryWorkoutStore` — the
 * repositories handed to `work` are built over the transaction's handle, not reused from `repos`.
 */
export function createInMemoryMesocycleClosingStore(store: InMemoryStore): MesocycleClosingStore {
  return {
    repos: mesocycleClosingRepositoriesOver(store),
    transaction: (work) =>
      store.transaction((handle) => work(mesocycleClosingRepositoriesOver(handle))),
  };
}
