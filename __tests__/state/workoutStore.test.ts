import { MOCK_MESOCYCLE_IDS } from '@domain/mesocycleMocks';
import { MOCK_SESSION_IDS } from '@domain/workoutMocks';
import { ensureWorkoutMocksSeeded, workoutSessionDeps } from '@state/workoutStore';
import { getWorkoutSession, getWorkoutSlot } from '@usecases/workoutSession';

describe('ensureWorkoutMocksSeeded', () => {
  test('seeds the stub sessions so the workout screen opens each mode', async () => {
    await ensureWorkoutMocksSeeded();

    const live = await getWorkoutSession(MOCK_SESSION_IDS.live, workoutSessionDeps);
    const completed = await getWorkoutSession(MOCK_SESSION_IDS.completed, workoutSessionDeps);
    const preview = await getWorkoutSlot(
      { mesoId: MOCK_MESOCYCLE_IDS.active, weekNumber: 3, dayNumber: 1 },
      workoutSessionDeps,
    );

    expect(live.mode).toBe('live');
    expect(live.header.mesocycleName).toBe('Upper/Lower');
    expect(live.progress).toBeCloseTo(2 / 6);
    expect(completed.mode).toBe('readonly');
    expect(completed.header.isCompleted).toBe(true);
    expect(preview.mode).toBe('preview');
    expect(preview.exercises.map((exercise) => exercise.name)).toEqual(
      live.exercises.map((exercise) => exercise.name),
    );
  });

  test('seeding again is a no-op', async () => {
    await ensureWorkoutMocksSeeded();
    await ensureWorkoutMocksSeeded();

    const sessions = await workoutSessionDeps.sessionRepo.listByMesoId('mock-mesocycle-active');
    expect(sessions).toHaveLength(2);
  });
});
