import { NotFoundError } from '@domain/errors';
import { InMemoryExerciseRepository } from '@storage/exerciseRepository';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import { InMemorySessionTreeRepository } from '@storage/sessionTree';
import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';

import {
  makeCatalogExercise,
  makeMesocycle,
  makeSession,
  makeSessionExercise,
} from '../contracts/fixtures';

// Assembling the tree is part of the shared repository contract (task 109, run from
// inMemoryContract.test.ts). Here: the two holes a tree can have — a session whose mesocycle
// isn't stored, and a session exercise pointing at an exercise that isn't in the catalog. A
// tree with a hole in it can't be shown, so the repository rejects instead of returning it.
//
// Both states are dangling references, which an adapter with referential integrity can't be
// asked to reproduce — that's why they aren't part of the shared contract.

async function treeOver(options: { withMesocycle: boolean; withExercise: boolean }) {
  const store = new InMemoryStore();
  if (options.withMesocycle) {
    await new InMemoryMesocycleRepository(store).create(makeMesocycle());
  }
  if (options.withExercise) {
    await new InMemoryExerciseRepository(store).seedCatalog(1, [
      makeCatalogExercise('exercise-bench-press'),
    ]);
  }
  const { repos } = createInMemoryWorkoutStore(store);
  await repos.sessionRepo.create(makeSession({ status: 'in_progress' }));
  await repos.sessionExerciseRepo.create(makeSessionExercise());

  return new InMemorySessionTreeRepository(store);
}

describe('InMemorySessionTreeRepository', () => {
  test('rejects with NotFoundError when the mesocycle is missing', async () => {
    const repo = await treeOver({ withMesocycle: false, withExercise: true });

    await expect(repo.getBySessionId('session-1')).rejects.toBeInstanceOf(NotFoundError);
  });

  test('rejects with NotFoundError when an exercise is missing from the catalog', async () => {
    const repo = await treeOver({ withMesocycle: true, withExercise: false });

    await expect(repo.getBySessionId('session-1')).rejects.toBeInstanceOf(NotFoundError);
  });
});
