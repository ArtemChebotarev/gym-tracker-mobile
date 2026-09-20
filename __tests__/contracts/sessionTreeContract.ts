import {
  makeCatalogExercise,
  makeMesocycle,
  makeSession,
  makeSessionExercise,
  makeSetLog,
} from './fixtures';
import { type RepositoryHarness, type RepositorySet, useRepositories } from './harness';

// SessionTreeRepository — a whole session as one tree, the shape the workout screen is built
// from (08.7 · Тренировка). Session → Mesocycle, Session → SessionExercise → Exercise and
// SessionExercise → SetLog are all assembled inside the repository (07 · Persistence Layer
// Contract, rules 2 and 4), so the use case layer only maps the result.

const FIRST_EXERCISE = 'exercise-bench-press';
const SECOND_EXERCISE = 'exercise-row';

async function seedSession(repositories: RepositorySet): Promise<void> {
  const { mesocycleRepo, exerciseRepo, sessionRepo, sessionExerciseRepo, setLogRepo } =
    repositories;
  await mesocycleRepo.create(makeMesocycle({ name: 'Upper/lower' }));
  await exerciseRepo.seedCatalog(1, [
    makeCatalogExercise(FIRST_EXERCISE),
    makeCatalogExercise(SECOND_EXERCISE),
  ]);
  await sessionRepo.create(makeSession({ status: 'in_progress' }));
  // Written out of order: the tree comes back sorted by `SessionExercise.order`.
  await sessionExerciseRepo.createMany([
    makeSessionExercise({ id: 'se-second', exerciseId: SECOND_EXERCISE, order: 2 }),
    makeSessionExercise({ id: 'se-first', exerciseId: FIRST_EXERCISE, order: 1 }),
  ]);
  await setLogRepo.create(
    makeSetLog({
      id: 'log-2',
      sessionExerciseId: 'se-first',
      setNumber: 2,
      exerciseId: FIRST_EXERCISE,
    }),
  );
  await setLogRepo.create(
    makeSetLog({
      id: 'log-1',
      sessionExerciseId: 'se-first',
      setNumber: 1,
      exerciseId: FIRST_EXERCISE,
    }),
  );
}

export function describeSessionTreeContract(harness: RepositoryHarness): void {
  describe('SessionTreeRepository', () => {
    const repositories = useRepositories(harness);

    beforeEach(async () => {
      await seedSession(repositories());
    });

    test('joins the session to its mesocycle, its exercises in order, their catalog records and logs', async () => {
      const tree = await repositories().sessionTreeRepo.getBySessionId('session-1');

      expect(tree?.session.id).toBe('session-1');
      expect(tree?.mesocycle.name).toBe('Upper/lower');
      expect(tree?.exercises.map(({ sessionExercise }) => sessionExercise.id)).toEqual([
        'se-first',
        'se-second',
      ]);
      expect(tree?.exercises.map(({ exercise }) => exercise.id)).toEqual([
        FIRST_EXERCISE,
        SECOND_EXERCISE,
      ]);
      expect(tree?.exercises[0]?.setLogs.map((setLog) => setLog.setNumber)).toEqual([1, 2]);
      expect(tree?.exercises[1]?.setLogs).toEqual([]);
    });

    test('resolves null for a session that does not exist', async () => {
      await expect(repositories().sessionTreeRepo.getBySessionId('missing')).resolves.toBeNull();
    });
  });
}
