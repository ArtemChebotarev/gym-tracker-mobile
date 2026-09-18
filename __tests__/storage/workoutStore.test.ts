import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';

const session: Session = {
  id: 'session-1',
  mesoId: 'meso',
  weekNumber: 1,
  dayNumber: 1,
  isDeload: false,
  prescriptionStatus: 'ready',
  status: 'planned',
};

const sessionExercise: SessionExercise = {
  id: 'session-exercise-1',
  sessionId: 'session-1',
  exerciseId: 'exercise-bench-press',
  order: 1,
  setTargets: [{ setNumber: 1 }],
  targetRir: 2,
  status: 'planned',
};

const setLog: SetLog = {
  id: 'set-log-1',
  sessionExerciseId: 'session-exercise-1',
  exerciseId: 'exercise-bench-press',
  setNumber: 1,
  weight: 60,
  reps: 10,
  completedAt: '2026-09-18T10:00:00.000Z',
};

describe('createInMemoryWorkoutStore', () => {
  test('writes made inside a transaction are visible through repos once it resolves', async () => {
    const workout = createInMemoryWorkoutStore(new InMemoryStore());

    await workout.transaction(async (repos) => {
      await repos.sessionRepo.create(session);
      await repos.sessionExerciseRepo.create(sessionExercise);
      await repos.setLogRepo.create(setLog);
    });

    await expect(workout.repos.sessionRepo.getById('session-1')).resolves.toEqual(session);
    await expect(workout.repos.setLogRepo.listBySessionId('session-1')).resolves.toEqual([setLog]);
  });

  test('a failure partway through rolls back writes across every workout repository', async () => {
    const workout = createInMemoryWorkoutStore(new InMemoryStore());
    await workout.repos.sessionRepo.create(session);
    await workout.repos.sessionExerciseRepo.create(sessionExercise);

    await expect(
      workout.transaction(async (repos) => {
        await repos.sessionRepo.update({ ...session, status: 'in_progress' });
        await repos.setLogRepo.create(setLog);
        throw new Error('failure partway through');
      }),
    ).rejects.toThrow('failure partway through');

    await expect(workout.repos.sessionRepo.getById('session-1')).resolves.toEqual(session);
    await expect(workout.repos.setLogRepo.listBySessionId('session-1')).resolves.toEqual([]);
  });

  test('two workout stores over the same InMemoryStore share its rows', async () => {
    const store = new InMemoryStore();

    await createInMemoryWorkoutStore(store).repos.sessionRepo.create(session);

    await expect(
      createInMemoryWorkoutStore(store).repos.sessionRepo.getById('session-1'),
    ).resolves.toEqual(session);
  });
});
