import { type Exercise, toExerciseId } from '@domain/catalog';
import { NotFoundError } from '@domain/errors';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { InMemoryExerciseRepository } from '@storage/exerciseRepository';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import { InMemorySessionTreeRepository } from '@storage/sessionTree';
import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';

const mesocycle: Mesocycle = {
  id: 'meso',
  name: 'Upper/lower',
  lengthWeeks: 4,
  daysPerWeek: 2,
  startDate: '2026-09-01T08:00:00.000Z',
  status: 'active',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
  createdAt: '2026-09-01T08:00:00.000Z',
};

const session: Session = {
  id: 'session',
  mesoId: 'meso',
  weekNumber: 1,
  dayNumber: 1,
  isDeload: false,
  prescriptionStatus: 'ready',
  status: 'in_progress',
};

function catalogExercise(id: string): Exercise {
  return {
    id: toExerciseId(id),
    name: id,
    muscleGroup: 'chest',
    source: 'catalog',
    isHidden: false,
  };
}

function sessionExercise(id: string, order: number, sessionId = 'session'): SessionExercise {
  return {
    id,
    sessionId,
    exerciseId: `exercise-${id}`,
    order,
    setTargets: [{ setNumber: 1 }, { setNumber: 2 }],
    targetRir: 2,
    status: 'planned',
  };
}

function log(sessionExerciseId: string, setNumber: number): SetLog {
  return {
    id: `${sessionExerciseId}-log-${setNumber}`,
    sessionExerciseId,
    exerciseId: `exercise-${sessionExerciseId}`,
    setNumber,
    weight: 50,
    reps: 10,
    completedAt: '2026-09-01T09:00:00.000Z',
  };
}

async function seeded(options: { withMesocycle?: boolean; exerciseIds?: string[] } = {}) {
  const store = new InMemoryStore();
  if (options.withMesocycle ?? true) {
    await new InMemoryMesocycleRepository(store).create(mesocycle);
  }
  const exercises = new InMemoryExerciseRepository(store);
  for (const id of options.exerciseIds ?? ['exercise-a', 'exercise-b', 'exercise-other']) {
    await exercises.createCustom(catalogExercise(id));
  }
  const { repos } = createInMemoryWorkoutStore(store);
  await repos.sessionRepo.create(session);
  await repos.sessionRepo.create({ ...session, id: 'other-session', dayNumber: 2 });
  await repos.sessionExerciseRepo.createMany([
    sessionExercise('b', 2),
    sessionExercise('a', 1),
    sessionExercise('other', 1, 'other-session'),
  ]);
  await repos.setLogRepo.create(log('a', 2));
  await repos.setLogRepo.create(log('a', 1));
  await repos.setLogRepo.create(log('other', 1));
  return new InMemorySessionTreeRepository(store);
}

describe('InMemorySessionTreeRepository', () => {
  test('joins the session to its mesocycle, exercises in order, catalog records and logs', async () => {
    const repo = await seeded();

    const tree = await repo.getBySessionId('session');

    expect(tree?.session).toEqual(session);
    expect(tree?.mesocycle.name).toBe('Upper/lower');
    expect(tree?.exercises.map(({ sessionExercise }) => sessionExercise.id)).toEqual(['a', 'b']);
    expect(tree?.exercises.map(({ exercise }) => exercise.id)).toEqual([
      'exercise-a',
      'exercise-b',
    ]);
    expect(tree?.exercises[0]?.setLogs.map((setLog) => setLog.setNumber)).toEqual([1, 2]);
    expect(tree?.exercises[1]?.setLogs).toEqual([]);
  });

  test('null for a session that does not exist', async () => {
    const repo = await seeded();

    await expect(repo.getBySessionId('missing')).resolves.toBeNull();
  });

  test('rejects with NotFoundError when the mesocycle is missing', async () => {
    const repo = await seeded({ withMesocycle: false });

    await expect(repo.getBySessionId('session')).rejects.toBeInstanceOf(NotFoundError);
  });

  test('rejects with NotFoundError when an exercise is missing from the catalog', async () => {
    const repo = await seeded({ exerciseIds: ['exercise-a'] });

    await expect(repo.getBySessionId('session')).rejects.toBeInstanceOf(NotFoundError);
  });
});
