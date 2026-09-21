// Composition root for the mesocycle use cases — see 08.5 · Редактор мезоцикла — Flow A (tasks
// 071, 072), 08.3 · Мезоциклы — список (tasks 074, 042's Start) and 08.7's mesocycle overview grid
// (task 089).
// Same role as exerciseLibraryStore.ts, and functions for the same reason: app/ must not import
// @storage or @repositories directly (app/README.md, 07 · Persistence Layer Contract, rule 9),
// and the repository set is installed at startup rather than built at import (task 111).
//
// Nothing is seeded here any more. `ensureMesocyclesSeeded` used to write the mock mesocycles of
// domain/mesocycleMocks.ts into storage on first read, which was harmless while storage was a
// Map and is not once it is a file: the mocks would settle into the database and become
// indistinguishable from the user's own (task 112). They are a test fixture now —
// __tests__/fixtures/mesocycleMocks.ts.

import { repositories } from '@state/repositories';
import type { MesocycleCreationDeps } from '@usecases/mesocycleCreation';
import type { MesocycleEditingDeps } from '@usecases/mesocycleEditing';
import type { MesoGridDeps } from '@usecases/mesoGrid';
import type { MesocycleListDeps } from '@usecases/mesocycleList';
import type { MesocycleStartDeps } from '@usecases/mesocycleStart';

export function mesocycleCreationDeps(): MesocycleCreationDeps {
  const { mesocycleRepo, settingsRepo } = repositories();
  return { mesocycleRepo, settingsRepo };
}

export function mesocycleListDeps(): MesocycleListDeps {
  const { mesocycleRepo } = repositories();
  return { mesocycleRepo };
}

export function mesocycleEditingDeps(): MesocycleEditingDeps {
  const { mesocycleRepo } = repositories();
  return { mesocycleRepo };
}

export function mesocycleStartDeps(): MesocycleStartDeps {
  const { mesocycleStartStore } = repositories();
  return { store: mesocycleStartStore };
}

export function mesoGridDeps(): MesoGridDeps {
  const { mesocycleRepo, sessionRepo } = repositories();
  return { mesocycleRepo, sessionRepo };
}
