import { createInMemoryRepositories } from '@storage/repositories';

import { describeRepositoryContract } from '../contracts/repositoryContract';

// Puts the in-memory adapter through the shared repository contract (task 109). The wiring it
// checks is the app's own (`createInMemoryRepositories`), not a copy of it built for the test —
// so what passes here is what `state/repositories.ts` can be handed. The SQLite adapter (task
// 067) gets a runner of its own, shaped exactly like this one.

describeRepositoryContract('in-memory', { create: async () => createInMemoryRepositories() });
