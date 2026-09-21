// Composition root for the mesocycle use cases — see 08.5 · Редактор мезоцикла — Flow A (tasks
// 071, 072), 08.3 · Мезоциклы — список (tasks 074, 042's Start) and 08.7's mesocycle overview grid
// (task 089).
// Same role as exerciseLibraryStore.ts, and hooks for the same reason: app/ must not import
// @storage or @repositories directly (app/README.md, 07 · Persistence Layer Contract, rule 9),
// and the repository set reaches a screen through context rather than a global (task 115).
//
// Nothing is seeded here any more. `ensureMesocyclesSeeded` used to write the mock mesocycles of
// domain/mesocycleMocks.ts into storage on first read, which was harmless while storage was a
// Map and is not once it is a file: the mocks would settle into the database and become
// indistinguishable from the user's own (task 112). They are a test fixture now —
// __tests__/fixtures/mesocycleMocks.ts.

import { useRepositories } from '@state/repositories';
import type { MesocycleClosingDeps } from '@usecases/mesocycleClosing';
import type { MesocycleCreationDeps } from '@usecases/mesocycleCreation';
import type { MesocycleEditingDeps } from '@usecases/mesocycleEditing';
import type { MesoGridDeps } from '@usecases/mesoGrid';
import type { MesocycleListDeps } from '@usecases/mesocycleList';
import type { MesocycleStartDeps } from '@usecases/mesocycleStart';

export function useMesocycleCreationDeps(): MesocycleCreationDeps {
  const { mesocycleRepo, settingsRepo } = useRepositories();
  return { mesocycleRepo, settingsRepo };
}

export function useMesocycleListDeps(): MesocycleListDeps {
  const { mesocycleRepo } = useRepositories();
  return { mesocycleRepo };
}

export function useMesocycleEditingDeps(): MesocycleEditingDeps {
  const { mesocycleRepo } = useRepositories();
  return { mesocycleRepo };
}

export function useMesocycleStartDeps(): MesocycleStartDeps {
  const { mesocycleStartStore } = useRepositories();
  return { store: mesocycleStartStore };
}

/** What Finish and Stop mesocycle (052) need: the store whose transaction closes a whole block. */
export function useMesocycleClosingDeps(): MesocycleClosingDeps {
  const { mesocycleClosingStore } = useRepositories();
  return { store: mesocycleClosingStore };
}

export function useMesoGridDeps(): MesoGridDeps {
  const { mesocycleRepo, sessionRepo } = useRepositories();
  return { mesocycleRepo, sessionRepo };
}
