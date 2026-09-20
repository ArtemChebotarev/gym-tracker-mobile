import { NotFoundError } from '@domain/errors';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { MESOCYCLE_COLLECTION } from '@storage/collectionNames';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import { InMemorySessionRepository } from '@storage/session';
import { InMemoryStore } from '@storage/store';

import { makeMesocycle, makeSession } from '../contracts/fixtures';
import { STAMPS } from '../fixtures/stamps';

// What `InMemoryMesocycleRepository` does beyond the shared repository contract (task 109, run
// from inMemoryContract.test.ts) — behaviour that can only be set up by reaching into this
// engine's collections, so it can't be stated for every implementation:
// - how a row written before a field existed reads back,
// - what a cascade that fails partway through leaves behind, seeded from a dangling reference
//   no implementation with referential integrity would let a caller create.

describe('InMemoryMesocycleRepository', () => {
  test('a mesocycle stored without historyLookbackDays reads back with the default of 30', async () => {
    const store = new InMemoryStore();
    const repo = new InMemoryMesocycleRepository(store);
    // Written straight into the collection, the way a record saved before task 083 would sit
    // in storage: its progressionSettings snapshot has no historyLookbackDays at all.
    const { historyLookbackDays: _omitted, ...legacySettings } = defaultProgressionSettings;
    await store.collection<Mesocycle>(MESOCYCLE_COLLECTION).insert(
      makeMesocycle({
        ...STAMPS,
        progressionSettings: legacySettings as Mesocycle['progressionSettings'],
      }) as Mesocycle,
    );

    const byId = await repo.getById('meso-a');
    const [fromList] = await repo.getAll();
    const active = await repo.getActive();

    expect(byId?.progressionSettings.historyLookbackDays).toBe(30);
    expect(fromList?.progressionSettings.historyLookbackDays).toBe(30);
    expect(active?.progressionSettings.historyLookbackDays).toBe(30);
  });

  test('deleteWithChildren rolls back the children it removed before finding no mesocycle', async () => {
    const store = new InMemoryStore();
    const mesocycles = new InMemoryMesocycleRepository(store);
    const sessions = new InMemorySessionRepository(store);
    // An orphan: its mesocycle never existed, so the cascade reaches it before the lookup fails.
    const survivor = await sessions.create(makeSession({ id: 'session-survivor', mesoId: 'missing' }));

    await expect(mesocycles.deleteWithChildren('missing')).rejects.toBeInstanceOf(NotFoundError);

    await expect(sessions.getById('session-survivor')).resolves.toEqual(survivor);
  });
});
