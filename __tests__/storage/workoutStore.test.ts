import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';

import { makeSession } from '../contracts/fixtures';

// Atomicity itself is part of the shared repository contract (task 109, run from
// inMemoryContract.test.ts). What's left here is specific to this engine: which store instance
// a set of repositories ends up reading from.

describe('createInMemoryWorkoutStore', () => {
  test('two workout stores over the same InMemoryStore share its rows', async () => {
    const store = new InMemoryStore();

    const created = await createInMemoryWorkoutStore(store).repos.sessionRepo.create(makeSession());

    await expect(
      createInMemoryWorkoutStore(store).repos.sessionRepo.getById('session-1'),
    ).resolves.toEqual(created);
  });
});
