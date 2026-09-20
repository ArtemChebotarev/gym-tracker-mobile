import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import {
  InMemoryExerciseHistoryRepository,
  readExercisePerformances,
} from '@storage/exerciseHistory';
import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';

const BENCH = 'bench-press';

function mesocycle(id: string, name: string): Mesocycle {
  return {
    id,
    name,
    lengthWeeks: 4,
    daysPerWeek: 2,
    startDate: '2026-09-01T08:00:00.000Z',
    status: 'active',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    createdAt: '2026-09-01T08:00:00.000Z',
  };
}

function session(id: string, overrides: Partial<Session> = {}): Session {
  return {
    id,
    mesoId: 'meso-1',
    weekNumber: 1,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'completed',
    completedAt: '2026-09-10T12:00:00.000Z',
    ...overrides,
  };
}

function sessionExercise(id: string, sessionId: string, exerciseId: string): SessionExercise {
  return {
    id,
    sessionId,
    exerciseId,
    order: 1,
    setTargets: [{ setNumber: 1 }],
    targetRir: 2,
    status: 'completed',
  };
}

function log(id: string, sessionExerciseId: string, exerciseId: string, setNumber: number): SetLog {
  return {
    id,
    sessionExerciseId,
    exerciseId,
    setNumber,
    weight: 80,
    reps: 8,
    completedAt: '2026-09-10T12:00:00.000Z',
  };
}

async function seeded() {
  const store = new InMemoryStore();
  const mesocycles = new InMemoryMesocycleRepository(store);
  await mesocycles.create(mesocycle('meso-1', 'Upper/Lower'));
  await mesocycles.create(mesocycle('meso-2', 'Full body'));
  const { repos } = createInMemoryWorkoutStore(store);
  await repos.sessionRepo.create(session('session-1'));
  await repos.sessionRepo.create(session('session-2', { weekNumber: 2, mesoId: 'meso-2' }));
  await repos.sessionExerciseRepo.createMany([
    sessionExercise('se-1', 'session-1', BENCH),
    sessionExercise('se-2', 'session-1', 'squat'),
    sessionExercise('se-3', 'session-2', BENCH),
    // No session row for this one — an orphan the repository has to drop.
    sessionExercise('se-orphan', 'session-missing', BENCH),
  ]);
  await repos.setLogRepo.create(log('log-2', 'se-1', BENCH, 2));
  await repos.setLogRepo.create(log('log-1', 'se-1', BENCH, 1));
  await repos.setLogRepo.create(log('log-squat', 'se-2', 'squat', 1));
  await repos.setLogRepo.create(log('log-3', 'se-3', BENCH, 1));
  await repos.setLogRepo.create(log('log-orphan', 'se-orphan', BENCH, 1));
  return { store, repo: new InMemoryExerciseHistoryRepository(store) };
}

describe('InMemoryExerciseHistoryRepository', () => {
  test('groups the exercise’s set logs by performance and joins each to its session', async () => {
    const { repo } = await seeded();

    const performances = await repo.listByExerciseId(BENCH);

    expect(performances).toHaveLength(2);
    expect(performances.map((performance) => performance.session.id).sort()).toEqual([
      'session-1',
      'session-2',
    ]);
  });

  test('sorts each performance’s set logs by set number', async () => {
    const { repo } = await seeded();

    const performances = await repo.listByExerciseId(BENCH);

    const first = performances.find((performance) => performance.session.id === 'session-1');
    expect(first?.setLogs.map((setLog) => setLog.id)).toEqual(['log-1', 'log-2']);
  });

  test('carries the mesocycle each session belongs to', async () => {
    const { repo } = await seeded();

    const performances = await repo.listByExerciseId(BENCH);

    expect(
      performances
        .map((performance) => performance.mesocycle.name)
        .sort(),
    ).toEqual(['Full body', 'Upper/Lower']);
  });

  test('drops a performance whose mesocycle cannot be resolved', async () => {
    const { store, repo } = await seeded();
    await store
      .collection<Session>('Session')
      .update('session-2', (existing) => ({ ...existing, mesoId: 'meso-gone' }));

    const performances = await repo.listByExerciseId(BENCH);

    expect(performances.map((performance) => performance.session.id)).toEqual(['session-1']);
  });

  test("leaves out another exercise's sets", async () => {
    const { repo } = await seeded();

    const performances = await repo.listByExerciseId(BENCH);

    expect(
      performances.flatMap((performance) => performance.setLogs).map((setLog) => setLog.id),
    ).not.toContain('log-squat');
  });

  test('drops a performance whose session cannot be resolved', async () => {
    const { repo } = await seeded();

    const performances = await repo.listByExerciseId(BENCH);

    expect(
      performances.flatMap((performance) => performance.setLogs).map((setLog) => setLog.id),
    ).not.toContain('log-orphan');
  });

  test('returns nothing for an exercise that was never logged', async () => {
    const { repo } = await seeded();

    await expect(repo.listByExerciseId('deadlift')).resolves.toEqual([]);
  });
});

// The join both exercise history and rule 6's reference lookup (findLastPerformance) read through
// — see storage/exerciseHistory.ts. It reports an unresolved session rather than deciding for
// them, because the two want opposite things from one.
describe('readExercisePerformances', () => {
  test('hands an unresolved session over as undefined instead of dropping it', async () => {
    const { store } = await seeded();

    const performances = await readExercisePerformances(store, BENCH);

    const orphan = performances.find(
      (performance) => performance.sessionExerciseId === 'se-orphan',
    );
    expect(orphan?.session).toBeUndefined();
    expect(orphan?.setLogs.map((setLog) => setLog.id)).toEqual(['log-orphan']);
  });

  test('leaves out the performance the caller excludes', async () => {
    const { store } = await seeded();

    const performances = await readExercisePerformances(store, BENCH, {
      excludeSessionExerciseId: 'se-1',
    });

    expect(performances.map((performance) => performance.sessionExerciseId)).not.toContain('se-1');
  });
});
