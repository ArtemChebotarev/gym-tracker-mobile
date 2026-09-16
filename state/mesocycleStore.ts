// Composition root for the mesocycle use cases — see 08.5 · Редактор мезоцикла — Flow A (tasks
// 071, 072) and 08.3 · Мезоциклы — список (task 074). Same role as exerciseLibraryStore.ts: app/ must
// not import @storage or @repositories directly (app/README.md, 07 · Persistence Layer Contract,
// rule 9), so the repository instance a screen's query/mutation needs is built here, over the
// app-wide store.

import { buildMockMesocycles } from '@domain/mesocycleMocks';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import type { MesocycleCreationDeps } from '@usecases/mesocycleCreation';
import type { MesocycleEditingDeps } from '@usecases/mesocycleEditing';
import type { MesocycleListDeps } from '@usecases/mesocycleList';

import { appStore } from './appStore';

const mesocycleRepo = new InMemoryMesocycleRepository(appStore);

export const mesocycleCreationDeps: MesocycleCreationDeps = { mesocycleRepo };

export const mesocycleListDeps: MesocycleListDeps = { mesocycleRepo };

export const mesocycleEditingDeps: MesocycleEditingDeps = { mesocycleRepo };

let seeded: Promise<void> | null = null;

/**
 * Seeds the stub mesocycles (domain/mesocycleMocks.ts) into the shared store, once per app
 * session. Mocks already present are skipped, so planned mesocycles saved through Flow A simply
 * sit alongside them — and a mock the user deleted isn't resurrected by a later call, since the
 * seeding itself only ever runs once.
 */
export function ensureMesocyclesSeeded(): Promise<void> {
  if (!seeded) {
    seeded = (async () => {
      for (const mesocycle of buildMockMesocycles(new Date())) {
        if (!(await mesocycleRepo.getById(mesocycle.id))) {
          await mesocycleRepo.create(mesocycle);
        }
      }
    })();
  }
  return seeded;
}
