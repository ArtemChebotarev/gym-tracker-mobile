// Composition root for the mesocycle-creation use cases — see 08.5 · Редактор мезоцикла — Flow A
// and task 071. Same role as exerciseLibraryStore.ts: app/ must not import @storage or
// @repositories directly (app/README.md, 07 · Persistence Layer Contract, rule 9), so the
// repository instance a screen's mutation needs is built here, over the app-wide store.

import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import type { MesocycleCreationDeps } from '@usecases/mesocycleCreation';

import { appStore } from './appStore';

export const mesocycleCreationDeps: MesocycleCreationDeps = {
  mesocycleRepo: new InMemoryMesocycleRepository(appStore),
};
