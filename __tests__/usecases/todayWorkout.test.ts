import { toExerciseId } from '@domain/catalog';
import type { Session, SessionExercise } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { InMemoryExerciseRepository } from '@storage/exerciseRepository';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import { InMemorySessionRepository } from '@storage/session';
import { InMemorySessionTreeRepository } from '@storage/sessionTree';
import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';
import { getTodayWorkout, type TodayWorkout, type TodayWorkoutDeps } from '@usecases/todayWorkout';

function mesocycleOf(id: string, status: Mesocycle['status']): Mesocycle {
  return {
    id,
    name: `Meso ${id}`,
    lengthWeeks: 4,
    daysPerWeek: 2,
    status,
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    createdAt: '2026-09-01T08:00:00.000Z',
    ...(status === 'planned' ? {} : { startDate: '2026-09-01T08:00:00.000Z' }),
  };
}

function slotSession(week: number, day: number, overrides: Partial<Session> = {}): Session {
  return {
    id: `w${week}d${day}`,
    mesoId: 'active',
    weekNumber: week,
    dayNumber: day,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'planned',
    ...overrides,
  };
}

function benchOf(session: Session): SessionExercise {
  return {
    id: `${session.id}-bench`,
    sessionId: session.id,
    exerciseId: 'bench',
    order: 1,
    setTargets: [{ setNumber: 1, targetReps: 10, suggestedWeight: 60 }],
    targetRir: 2,
    status: session.status === 'completed' ? 'completed' : 'planned',
  };
}

type Setup = { mesocycles?: Mesocycle[]; sessions?: Session[] };

async function setUp({
  mesocycles = [mesocycleOf('active', 'active')],
  sessions = [],
}: Setup = {}): Promise<TodayWorkoutDeps> {
  const store = new InMemoryStore();
  const mesocycleRepo = new InMemoryMesocycleRepository(store);
  for (const mesocycle of mesocycles) {
    await mesocycleRepo.create(mesocycle);
  }
  await new InMemoryExerciseRepository(store).createCustom({
    id: toExerciseId('bench'),
    name: 'Bench press',
    muscleGroup: 'chest',
    source: 'catalog',
    isHidden: false,
  });
  const { repos } = createInMemoryWorkoutStore(store);
  await repos.sessionRepo.createMany(sessions);
  // An `awaiting_source` session has no exercises yet (02, "Session").
  await repos.sessionExerciseRepo.createMany(
    sessions
      .filter((session) => session.prescriptionStatus === 'ready')
      .map((session) => benchOf(session)),
  );
  return {
    mesocycleRepo,
    sessionTreeRepo: new InMemorySessionTreeRepository(store),
    sessionRepo: new InMemorySessionRepository(store),
  };
}

function sessionOf(today: TodayWorkout) {
  if (today.kind !== 'session') {
    throw new Error(`Expected a session, got "${today.kind}".`);
  }
  return today.model;
}

const completed = { status: 'completed', completedAt: '2026-09-02T10:00:00.000Z' } as const;

describe('getTodayWorkout', () => {
  test('DoD: the session in progress, even with an earlier day still ready', async () => {
    const deps = await setUp({
      sessions: [
        slotSession(1, 1, completed),
        slotSession(1, 2),
        slotSession(2, 1, { status: 'in_progress', startedAt: '2026-09-18T10:00:00.000Z' }),
      ],
    });

    const model = sessionOf(await getTodayWorkout(deps));

    expect(model.sessionId).toBe('w2d1');
    expect(model.mode).toBe('live');
  });

  test('DoD: the session in progress wherever it is — only one can be, app-wide', async () => {
    const deps = await setUp({
      mesocycles: [mesocycleOf('active', 'active'), mesocycleOf('old', 'abandoned')],
      sessions: [
        slotSession(1, 1),
        slotSession(3, 2, {
          id: 'old-w3d2',
          mesoId: 'old',
          status: 'in_progress',
          startedAt: '2026-09-18T10:00:00.000Z',
        }),
      ],
    });

    expect(sessionOf(await getTodayWorkout(deps)).sessionId).toBe('old-w3d2');
  });

  test('DoD: otherwise the earliest ready session of the active mesocycle, by week then day', async () => {
    const deps = await setUp({
      mesocycles: [mesocycleOf('active', 'active'), mesocycleOf('next', 'planned')],
      sessions: [
        slotSession(1, 1, completed),
        slotSession(1, 2, { status: 'skipped' }),
        slotSession(2, 2),
        slotSession(3, 1),
        slotSession(2, 1),
      ],
    });

    const model = sessionOf(await getTodayWorkout(deps));

    expect(model.sessionId).toBe('w2d1');
    expect(model.mode).toBe('live');
    expect(model.header).toMatchObject({ weekNumber: 2, dayNumber: 1 });
  });

  test('DoD: the earliest day still awaiting_source opens as its preview', async () => {
    const deps = await setUp({
      sessions: [
        slotSession(1, 1, completed),
        slotSession(1, 2, completed),
        slotSession(2, 1, { prescriptionStatus: 'awaiting_source' }),
        slotSession(2, 2),
      ],
    });

    const model = sessionOf(await getTodayWorkout(deps));

    expect(model.sessionId).toBe('w2d1');
    expect(model.mode).toBe('preview');
    expect(model.exercises.map((exercise) => exercise.name)).toEqual(['Bench press']);
    expect(model.unlocksAfter).toEqual({ weekNumber: 1, dayNumber: 1 });
  });

  test('DoD: no active mesocycle — nothing to open, even with a planned one', async () => {
    const deps = await setUp({
      mesocycles: [mesocycleOf('next', 'planned'), mesocycleOf('done', 'completed')],
      sessions: [slotSession(1, 1, { mesoId: 'done', ...completed })],
    });

    expect(await getTodayWorkout(deps)).toEqual({ kind: 'noActiveMesocycle' });
  });

  test('DoD: the active mesocycle has nothing left to train', async () => {
    const deps = await setUp({
      sessions: [slotSession(1, 1, completed), slotSession(1, 2, { status: 'skipped' })],
    });

    expect(await getTodayWorkout(deps)).toEqual({ kind: 'allDone', mesoId: 'active' });
  });
});
