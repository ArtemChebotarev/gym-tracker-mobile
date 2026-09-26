import type { Session } from '@domain/execution';
import { WORKOUT_FIXTURE_IDS, seedWorkoutFixture } from '../fixtures/workoutFixture';
import { createSqliteRepositories } from '@storage/sqlite/repositories';
import { loadMesocycleDetail, type MesocycleDetailDeps } from '@usecases/mesocycleDetail';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

// Over the fixture's active block on real SQLite: Upper/Lower, 5 × 4, week 1 day 1 completed with
// 3 bench + 3 row sets, week 2 day 1 in progress with 2 bench sets.
const db = withTestDatabase();

async function seeded() {
  const repositories = createSqliteRepositories(db());
  await seedWorkoutFixture(repositories);
  const deps: MesocycleDetailDeps = {
    mesocycleRepo: repositories.mesocycleRepo,
    sessionRepo: repositories.sessionRepo,
    setLogRepo: repositories.setLogRepo,
    exerciseRepo: repositories.exerciseRepo,
  };
  return { repositories, deps };
}

describe('loadMesocycleDetail', () => {
  test("reads the block's sessions, sets and exercises into the domain summary", async () => {
    const { deps } = await seeded();

    const detail = await loadMesocycleDetail(WORKOUT_FIXTURE_IDS.mesocycle, deps);

    expect(detail?.mesocycle.name).toBe('Upper/Lower');
    expect(detail?.weekNumber).toBe(2);
    expect(detail?.summary).toEqual({
      workouts: { value: 1, total: 20 },
      strengthSets: 8,
      weeks: { value: 2, total: 5 },
      weeklySets: [
        { muscleGroup: 'chest', sets: [3, 2, 0, 0, 0] },
        { muscleGroup: 'back', sets: [3, 0, 0, 0, 0] },
      ],
    });
  });

  test('a skipped day adds to its week but not to the workouts done', async () => {
    const { repositories, deps } = await seeded();
    const skipped: Session = {
      id: 'w3d1',
      mesoId: WORKOUT_FIXTURE_IDS.mesocycle,
      weekNumber: 3,
      dayNumber: 1,
      isDeload: false,
      prescriptionStatus: 'ready',
      status: 'skipped',
      createdAt: '2026-09-01T12:00:00.000Z',
      updatedAt: '2026-09-01T12:00:00.000Z',
    };
    await repositories.workoutStore.repos.sessionRepo.create(skipped);

    const detail = await loadMesocycleDetail(WORKOUT_FIXTURE_IDS.mesocycle, deps);

    expect(detail?.summary.workouts).toEqual({ value: 1, total: 20 });
    expect(detail?.summary.weeks).toEqual({ value: 3, total: 5 });
  });

  test('null for a mesocycle that does not exist', async () => {
    const { deps } = await seeded();

    expect(await loadMesocycleDetail('missing', deps)).toBeNull();
  });
});
