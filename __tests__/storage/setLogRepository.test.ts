import { InMemorySessionRepository } from '@storage/session';
import { InMemorySessionExerciseRepository } from '@storage/sessionExercise';
import { InMemorySetLogRepository } from '@storage/setLogRepository';
import { InMemoryStore } from '@storage/store';

import { makeSession, makeSessionExercise, makeSetLog } from '../contracts/fixtures';

// `findLastPerformance` as a whole belongs to the shared repository contract (task 109, run from
// inMemoryContract.test.ts). What stays here is its behaviour on a set log whose session
// exercise doesn't resolve: rule 6 of 03 · Progression Engine recommends nothing rather than
// guess when the newest performance can't be joined to a session, and there is no telling
// whether it was a deload or which mesocycle it belonged to.
//
// This isn't stated for every implementation on purpose — an adapter that enforces referential
// integrity makes such a row impossible to write in the first place, so the contract would be
// asking it to reproduce a state it forbids.

const BENCH_PRESS = 'exercise-bench-press';
const OLDER_THAN_SINCE = '2026-07-01T08:00:00.000Z';
const NEWER_THAN_SINCE = '2026-09-01T08:00:00.000Z';

async function seededWithWorkingPerformance(completedAt: string) {
  const store = new InMemoryStore();
  const setLogs = new InMemorySetLogRepository(store);
  await new InMemorySessionRepository(store).create(makeSession({ status: 'completed' }));
  await new InMemorySessionExerciseRepository(store).create(
    makeSessionExercise({ id: 'se-working', status: 'completed' }),
  );
  await setLogs.create(
    makeSetLog({ id: 'log-working', sessionExerciseId: 'se-working', completedAt }),
  );
  return setLogs;
}

function findBenchReference(setLogs: InMemorySetLogRepository) {
  return setLogs.findLastPerformance({
    exerciseId: BENCH_PRESS,
    mesoId: 'meso-a',
    since: '2026-08-19T00:00:00.000Z',
  });
}

describe('InMemorySetLogRepository', () => {
  test('returns an empty list when a newer performance cannot be joined to its session', async () => {
    const setLogs = await seededWithWorkingPerformance(OLDER_THAN_SINCE);
    // No session exercise row for this one: its deload flag and mesocycle are unknown.
    await setLogs.create(
      makeSetLog({
        id: 'log-orphan',
        sessionExerciseId: 'se-orphan',
        completedAt: NEWER_THAN_SINCE,
      }),
    );

    await expect(findBenchReference(setLogs)).resolves.toEqual([]);
  });

  test('ignores a broken performance older than the reference it already found', async () => {
    const setLogs = await seededWithWorkingPerformance(NEWER_THAN_SINCE);
    await setLogs.create(
      makeSetLog({
        id: 'log-orphan',
        sessionExerciseId: 'se-orphan',
        completedAt: OLDER_THAN_SINCE,
      }),
    );

    const reference = await findBenchReference(setLogs);

    expect(reference.map((setLog) => setLog.id)).toEqual(['log-working']);
  });
});
