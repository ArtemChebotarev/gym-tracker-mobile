import { type Exercise, toExerciseId } from '@domain/catalog';
import type { Session, SessionExercise } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { SqliteExerciseRepository } from '@storage/sqlite/exerciseRepository';
import { SqliteMesocycleRepository } from '@storage/sqlite/mesocycle';
import { createSqliteWorkoutStore } from '@storage/sqlite/workoutStore';
import { sessionWorkoutKind, type WorkoutKindDeps } from '@usecases/workoutKind';
import { HEAVY_BAG } from '../fixtures/hybridExercises';
import { STAMPS } from '../fixtures/stamps';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

const BENCH: Exercise = {
  ...STAMPS,
  id: toExerciseId('bench'),
  name: 'bench',
  muscleGroup: 'chest',
  source: 'catalog',
  isHidden: false,
};

const mesocycle: Mesocycle = {
  ...STAMPS,
  id: 'meso',
  name: 'Full body',
  lengthWeeks: 4,
  daysPerWeek: 1,
  startDate: '2026-09-04T08:00:00.000Z',
  status: 'active',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
  createdAt: '2026-09-01T08:00:00.000Z',
};

const session: Session = {
  ...STAMPS,
  id: 'session',
  mesoId: 'meso',
  weekNumber: 1,
  dayNumber: 1,
  isDeload: false,
  prescriptionStatus: 'ready',
  status: 'completed',
  startedAt: '2026-09-18T10:00:00.000Z',
  completedAt: '2026-09-18T11:00:00.000Z',
};

function sessionExercise(
  exercise: Exercise,
  order: number,
  status: SessionExercise['status'],
): SessionExercise {
  return {
    ...STAMPS,
    id: `session-exercise-${exercise.id}`,
    sessionId: session.id,
    exerciseId: exercise.id,
    order,
    setTargets: [],
    targetRir: 1,
    status,
  };
}

async function setUp(exercises: SessionExercise[]): Promise<WorkoutKindDeps> {
  const store = db();
  const workout = createSqliteWorkoutStore(store);
  const exerciseRepo = new SqliteExerciseRepository(store);
  await exerciseRepo.seedCatalog([BENCH]);
  await exerciseRepo.createCustom(HEAVY_BAG);
  await new SqliteMesocycleRepository(store).create(mesocycle);
  await workout.repos.sessionRepo.create(session);
  await workout.repos.sessionExerciseRepo.createMany(exercises);
  return { workout, exerciseRepo };
}

describe('sessionWorkoutKind', () => {
  test('a day of strength exercises is a strength day', async () => {
    const deps = await setUp([sessionExercise(BENCH, 0, 'completed')]);

    await expect(sessionWorkoutKind(session.id, deps)).resolves.toBe('strength');
  });

  test('a done hybrid exercise makes the day hybrid', async () => {
    const deps = await setUp([
      sessionExercise(BENCH, 0, 'completed'),
      sessionExercise(HEAVY_BAG, 1, 'completed'),
    ]);

    await expect(sessionWorkoutKind(session.id, deps)).resolves.toBe('hybrid');
  });

  test('a skipped hybrid exercise leaves it a strength day', async () => {
    const deps = await setUp([
      sessionExercise(BENCH, 0, 'completed'),
      sessionExercise(HEAVY_BAG, 1, 'skipped'),
    ]);

    await expect(sessionWorkoutKind(session.id, deps)).resolves.toBe('strength');
  });
});
