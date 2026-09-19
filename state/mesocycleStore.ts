// Composition root for the mesocycle use cases — see 08.5 · Редактор мезоцикла — Flow A (tasks
// 071, 072), 08.3 · Мезоциклы — список (tasks 074, 042's Start) and 08.7's mesocycle overview grid
// (task 089).
// Same role as exerciseLibraryStore.ts: app/ must not import @storage or @repositories directly
// (app/README.md, 07 · Persistence Layer Contract, rule 9), so the repository instance a screen's
// query/mutation needs is built here, over the app-wide store.

import { buildMockMesocycles } from '@domain/mesocycleMocks';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import { createInMemoryMesocycleStartStore } from '@storage/mesocycleStartStore';
import { InMemorySessionRepository } from '@storage/session';
import { InMemorySettingsRepository } from '@storage/settings';
import type { MesocycleCreationDeps } from '@usecases/mesocycleCreation';
import type { MesocycleEditingDeps } from '@usecases/mesocycleEditing';
import type { MesoGridDeps } from '@usecases/mesoGrid';
import type { MesocycleListDeps } from '@usecases/mesocycleList';
import type { MesocycleStartDeps } from '@usecases/mesocycleStart';

import { appStore } from './appStore';

const mesocycleRepo = new InMemoryMesocycleRepository(appStore);

// Settings is a single global record, not a collection of the shared store — see
// storage/settings.ts — so it has its own instance rather than one built over `appStore`.
const settingsRepo = new InMemorySettingsRepository();

export const mesocycleCreationDeps: MesocycleCreationDeps = { mesocycleRepo, settingsRepo };

export const mesocycleListDeps: MesocycleListDeps = { mesocycleRepo };

export const mesocycleEditingDeps: MesocycleEditingDeps = { mesocycleRepo };

export const mesocycleStartDeps: MesocycleStartDeps = {
  store: createInMemoryMesocycleStartStore(appStore),
};

export const mesoGridDeps: MesoGridDeps = {
  mesocycleRepo,
  sessionRepo: new InMemorySessionRepository(appStore),
};

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
