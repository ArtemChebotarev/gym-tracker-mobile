// The single in-memory store every composition root in state/ wires its repositories to. One
// store, not one per feature: mesocycles, sessions, set logs, and exercises all reference each
// other by id, and cross-entity operations (e.g. `MesocycleRepository.deleteWithChildren`
// cascading into set logs, or Start writing a mesocycle and its sessions in one
// transaction) only see each other's rows if they share it. See 07 · Persistence Layer Contract.

import { InMemoryStore } from '@storage/store';

export const appStore = new InMemoryStore();
