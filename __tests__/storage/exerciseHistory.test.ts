import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { InMemoryExerciseHistoryRepository } from '@storage/exerciseHistory';
import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';

const BENCH = 'bench-press';

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
  return new InMemoryExerciseHistoryRepository(store);
}

describe('InMemoryExerciseHistoryRepository', () => {
  test('groups the exercise’s set logs by performance and joins each to its session', async () => {
    const repo = await seeded();

    const performances = await repo.listByExerciseId(BENCH);

    expect(performances).toHaveLength(2);
    expect(performances.map((performance) => performance.session.id).sort()).toEqual([
      'session-1',
      'session-2',
    ]);
  });

  test('sorts each performance’s set logs by set number', async () => {
    const repo = await seeded();

    const performances = await repo.listByExerciseId(BENCH);

    const first = performances.find((performance) => performance.session.id === 'session-1');
    expect(first?.setLogs.map((setLog) => setLog.id)).toEqual(['log-1', 'log-2']);
  });

  test("leaves out another exercise's sets", async () => {
    const repo = await seeded();

    const performances = await repo.listByExerciseId(BENCH);

    expect(
      performances.flatMap((performance) => performance.setLogs).map((setLog) => setLog.id),
    ).not.toContain('log-squat');
  });

  test('drops a performance whose session cannot be resolved', async () => {
    const repo = await seeded();

    const performances = await repo.listByExerciseId(BENCH);

    expect(
      performances.flatMap((performance) => performance.setLogs).map((setLog) => setLog.id),
    ).not.toContain('log-orphan');
  });

  test('returns nothing for an exercise that was never logged', async () => {
    const repo = await seeded();

    await expect(repo.listByExerciseId('deadlift')).resolves.toEqual([]);
  });
});
