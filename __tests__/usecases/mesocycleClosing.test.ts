import { isConflictError, isNotFoundError } from '@domain/errors';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { createSqliteMesocycleClosingStore } from '@storage/sqlite/mesocycleClosingStore';
import {
  finishMesocycle,
  type MesocycleClosingDeps,
  stopMesocycle,
} from '@usecases/mesocycleClosing';

import { STAMPS } from '../fixtures/stamps';
import { seedReferences } from '../fixtures/references';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

const NOW = '2026-09-28T18:00:00.000Z';

const mesocycle: Mesocycle = {
  ...STAMPS,
  id: 'meso',
  name: 'Upper/Lower',
  lengthWeeks: 4,
  daysPerWeek: 1,
  startDate: '2026-09-01T08:00:00.000Z',
  status: 'active',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
};

function makeSession(overrides: Partial<Session> & Pick<Session, 'id'>): Session {
  return {
    ...STAMPS,
    mesoId: 'meso',
    weekNumber: 1,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'planned',
    ...overrides,
  };
}

function makeExercise(
  overrides: Partial<SessionExercise> & Pick<SessionExercise, 'id' | 'sessionId'>,
): SessionExercise {
  return {
    ...STAMPS,
    exerciseId: 'bench',
    order: 1,
    setTargets: [{ setNumber: 1 }, { setNumber: 2 }],
    targetRir: 2,
    status: 'planned',
    ...overrides,
  };
}

function makeLog(overrides: Partial<SetLog> & Pick<SetLog, 'id' | 'sessionExerciseId'>): SetLog {
  return {
    ...STAMPS,
    exerciseId: 'bench',
    setNumber: 1,
    weight: 60,
    reps: 10,
    completedAt: '2026-09-28T17:30:00.000Z',
    ...overrides,
  };
}

async function setUp(
  options: {
    mesocycle?: Mesocycle;
    sessions?: Session[];
    exercises?: SessionExercise[];
    logs?: SetLog[];
  } = {},
): Promise<MesocycleClosingDeps> {
  const store = createSqliteMesocycleClosingStore(db());
  await store.repos.mesocycleRepo.create(options.mesocycle ?? mesocycle);
  await seedReferences(db(), {
    sessions: options.sessions,
    sessionExercises: options.exercises,
    setLogs: options.logs,
  });
  if (options.sessions?.length) {
    await store.repos.sessionRepo.createMany(options.sessions);
  }
  if (options.exercises?.length) {
    await store.repos.sessionExerciseRepo.createMany(options.exercises);
  }
  for (const log of options.logs ?? []) {
    await store.repos.setLogRepo.create(log);
  }
  return { store };
}

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject.');
}

describe('finishMesocycle', () => {
  test('DoD: finishing a block whose sessions are all final completes it, and nothing is active after', async () => {
    const deps = await setUp({
      sessions: [
        makeSession({ id: 'w1', status: 'completed', completedAt: '2026-09-07T10:00:00.000Z' }),
        makeSession({ id: 'w2', weekNumber: 2, status: 'skipped' }),
      ],
    });

    const finished = await finishMesocycle('meso', deps, NOW);

    expect(finished).toMatchObject({ status: 'completed', completedAt: NOW });
    await expect(deps.store.repos.mesocycleRepo.getActive()).resolves.toBeNull();
  });

  test('a block with nothing programmed yet is finishable too — there is nothing left in it', async () => {
    const deps = await setUp();

    await expect(finishMesocycle('meso', deps, NOW)).resolves.toMatchObject({
      status: 'completed',
    });
  });

  test('DoD: nothing closes itself — a block with a session still to train is rejected', async () => {
    const deps = await setUp({
      sessions: [
        makeSession({ id: 'w1', status: 'completed' }),
        makeSession({ id: 'w2', weekNumber: 2, status: 'planned' }),
      ],
    });

    expect(isConflictError(await rejectionOf(finishMesocycle('meso', deps, NOW)))).toBe(true);
    await expect(deps.store.repos.mesocycleRepo.getById('meso')).resolves.toMatchObject({
      status: 'active',
    });
  });

  test.each(['planned', 'completed', 'abandoned'] as const)(
    'rejected for a %s mesocycle',
    async (status) => {
      const deps = await setUp({ mesocycle: { ...mesocycle, status } });

      expect(isConflictError(await rejectionOf(finishMesocycle('meso', deps, NOW)))).toBe(true);
    },
  );

  test('rejected for a mesocycle that does not exist', async () => {
    const deps = await setUp();

    expect(isNotFoundError(await rejectionOf(finishMesocycle('nope', deps, NOW)))).toBe(true);
  });
});

describe('stopMesocycle', () => {
  test('DoD: stopping abandons the block and leaves nothing active', async () => {
    const deps = await setUp({
      sessions: [makeSession({ id: 'w1', status: 'planned' })],
      exercises: [makeExercise({ id: 'w1-bench', sessionId: 'w1' })],
    });

    const { mesocycle: stopped } = await stopMesocycle('meso', deps, NOW);

    expect(stopped).toMatchObject({ status: 'abandoned', completedAt: NOW });
    await expect(deps.store.repos.mesocycleRepo.getActive()).resolves.toBeNull();
  });

  test('DoD: the session in progress with a logged set is completed, its unfinished exercises abandoned, its logs kept', async () => {
    const deps = await setUp({
      sessions: [
        makeSession({
          id: 'live',
          weekNumber: 2,
          status: 'in_progress',
          startedAt: '2026-09-28T17:00:00.000Z',
        }),
      ],
      exercises: [
        makeExercise({ id: 'live-bench', sessionId: 'live', status: 'completed' }),
        makeExercise({ id: 'live-row', sessionId: 'live', exerciseId: 'row', order: 2 }),
      ],
      logs: [makeLog({ id: 'log-1', sessionExerciseId: 'live-bench' })],
    });

    await stopMesocycle('meso', deps, NOW);

    await expect(deps.store.repos.sessionRepo.getById('live')).resolves.toMatchObject({
      status: 'completed',
      completedAt: NOW,
    });
    const exercises = await deps.store.repos.sessionExerciseRepo.listBySessionId('live');
    expect(exercises.map((exercise) => [exercise.id, exercise.status])).toEqual([
      ['live-bench', 'completed'],
      // Stop closed it, not the user (136).
      ['live-row', 'abandoned'],
    ]);
    await expect(deps.store.repos.setLogRepo.listBySessionId('live')).resolves.toHaveLength(1);
  });

  test('DoD: the session in progress with nothing logged is abandoned, undated, and so are its exercises', async () => {
    const deps = await setUp({
      sessions: [makeSession({ id: 'live', status: 'in_progress' })],
      exercises: [makeExercise({ id: 'live-bench', sessionId: 'live' })],
    });

    await stopMesocycle('meso', deps, NOW);

    const session = await deps.store.repos.sessionRepo.getById('live');
    expect(session?.status).toBe('abandoned');
    expect(session?.completedAt).toBeUndefined();
    await expect(
      deps.store.repos.sessionExerciseRepo.listBySessionId('live'),
    ).resolves.toMatchObject([{ id: 'live-bench', status: 'abandoned' }]);
  });

  test('DoD: every other unfinished session is abandoned, and finished ones — a skip included — are left alone', async () => {
    const completedAt = '2026-09-07T10:00:00.000Z';
    const deps = await setUp({
      sessions: [
        makeSession({ id: 'done', status: 'completed', completedAt }),
        makeSession({ id: 'was-skipped', weekNumber: 2, status: 'skipped' }),
        makeSession({ id: 'ready', weekNumber: 3, status: 'planned' }),
        makeSession({
          id: 'awaiting',
          weekNumber: 4,
          status: 'planned',
          prescriptionStatus: 'awaiting_source',
        }),
      ],
    });

    const { closedSessions } = await stopMesocycle('meso', deps, NOW);

    expect(closedSessions.map((session) => session.id).sort()).toEqual(['awaiting', 'ready']);
    const byId = new Map(
      (await deps.store.repos.sessionRepo.listByMesoId('meso')).map((session) => [
        session.id,
        session,
      ]),
    );
    expect(byId.get('ready')?.status).toBe('abandoned');
    expect(byId.get('awaiting')?.status).toBe('abandoned');
    expect(byId.get('done')).toMatchObject({ status: 'completed', completedAt });
    // The user's own skip stays theirs: `skipped` is never what Stop writes (136).
    expect(byId.get('was-skipped')?.status).toBe('skipped');
  });

  test('DoD: no next-week session is generated', async () => {
    const deps = await setUp({
      sessions: [makeSession({ id: 'live', status: 'in_progress' })],
      exercises: [makeExercise({ id: 'live-bench', sessionId: 'live' })],
      logs: [makeLog({ id: 'log-1', sessionExerciseId: 'live-bench' })],
    });

    await stopMesocycle('meso', deps, NOW);

    await expect(deps.store.repos.sessionRepo.listByMesoId('meso')).resolves.toHaveLength(1);
  });

  test("another block's sessions are not touched", async () => {
    const deps = await setUp({
      sessions: [
        makeSession({ id: 'live', status: 'in_progress' }),
        makeSession({ id: 'other', mesoId: 'other-meso', status: 'planned' }),
      ],
    });

    await stopMesocycle('meso', deps, NOW);

    await expect(deps.store.repos.sessionRepo.getById('other')).resolves.toMatchObject({
      status: 'planned',
    });
  });

  test.each(['planned', 'completed', 'abandoned'] as const)(
    'rejected for a %s mesocycle, and nothing is written',
    async (status) => {
      const deps = await setUp({
        mesocycle: { ...mesocycle, status },
        sessions: [makeSession({ id: 'ready', status: 'planned' })],
      });

      expect(isConflictError(await rejectionOf(stopMesocycle('meso', deps, NOW)))).toBe(true);
      await expect(deps.store.repos.sessionRepo.getById('ready')).resolves.toMatchObject({
        status: 'planned',
      });
    },
  );

  test('rejected for a mesocycle that does not exist', async () => {
    const deps = await setUp();

    expect(isNotFoundError(await rejectionOf(stopMesocycle('nope', deps, NOW)))).toBe(true);
  });
});
