import {
  InMemoryExerciseHistoryRepository,
  readExercisePerformances,
} from '@storage/exerciseHistory';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';

import { makeMesocycle, makeSession, makeSessionExercise, makeSetLog } from '../contracts/fixtures';

// The join itself is part of the shared repository contract (task 109, run from
// inMemoryContract.test.ts). Here: what the in-memory adapter does with a performance that
// can't be placed — its session or that session's mesocycle is gone — plus the store-level
// helper both this repository and rule 6's reference lookup read through, which reports an
// unresolved session instead of deciding for them.
//
// Dangling references are deliberately left out of the shared contract: an adapter with
// referential integrity can't produce one, so the state below is this engine's to answer for.

const BENCH_PRESS = 'exercise-bench-press';

async function seeded() {
  const store = new InMemoryStore();
  await new InMemoryMesocycleRepository(store).create(makeMesocycle({ id: 'meso-1' }));
  const { repos } = createInMemoryWorkoutStore(store);

  await repos.sessionRepo.create(makeSession({ id: 'session-1', mesoId: 'meso-1' }));
  // Its mesocycle was never stored: the performance underneath can't say where it belongs.
  await repos.sessionRepo.create(makeSession({ id: 'session-2', mesoId: 'meso-gone' }));
  await repos.sessionExerciseRepo.createMany([
    makeSessionExercise({ id: 'se-1', sessionId: 'session-1' }),
    makeSessionExercise({ id: 'se-meso-gone', sessionId: 'session-2' }),
    // No session row for this one — an orphan the repository has to drop.
    makeSessionExercise({ id: 'se-orphan', sessionId: 'session-missing' }),
  ]);
  for (const [id, sessionExerciseId] of [
    ['log-1', 'se-1'],
    ['log-meso-gone', 'se-meso-gone'],
    ['log-orphan', 'se-orphan'],
  ]) {
    await repos.setLogRepo.create(makeSetLog({ id, sessionExerciseId }));
  }

  return { store, repo: new InMemoryExerciseHistoryRepository(store) };
}

describe('InMemoryExerciseHistoryRepository', () => {
  test('drops a performance whose mesocycle cannot be resolved', async () => {
    const { repo } = await seeded();

    const performances = await repo.listByExerciseId(BENCH_PRESS);

    expect(performances.map((performance) => performance.session.id)).toEqual(['session-1']);
  });

  test('drops a performance whose session cannot be resolved', async () => {
    const { repo } = await seeded();

    const performances = await repo.listByExerciseId(BENCH_PRESS);

    expect(
      performances.flatMap((performance) => performance.setLogs).map((setLog) => setLog.id),
    ).not.toContain('log-orphan');
  });
});

// The join both exercise history and rule 6's reference lookup (findLastPerformance) read through
// — see storage/exerciseHistory.ts. It reports an unresolved session rather than deciding for
// them, because the two want opposite things from one.
describe('readExercisePerformances', () => {
  test('hands an unresolved session over as undefined instead of dropping it', async () => {
    const { store } = await seeded();

    const performances = await readExercisePerformances(store, BENCH_PRESS);

    const orphan = performances.find(
      (performance) => performance.sessionExerciseId === 'se-orphan',
    );
    expect(orphan?.session).toBeUndefined();
    expect(orphan?.setLogs.map((setLog) => setLog.id)).toEqual(['log-orphan']);
  });

  test('leaves out the performance the caller excludes', async () => {
    const { store } = await seeded();

    const performances = await readExercisePerformances(store, BENCH_PRESS, {
      excludeSessionExerciseId: 'se-1',
    });

    expect(performances.map((performance) => performance.sessionExerciseId)).not.toContain('se-1');
  });
});
