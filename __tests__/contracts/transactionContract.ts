import {
  makeCatalogExercise,
  makeMesocycle,
  makeSession,
  makeSessionExercise,
  makeSetLog,
} from './fixtures';
import { type RepositoryHarness, useRepositories } from './harness';

// Atomicity — 07 · Persistence Layer Contract, rule 6: "Есть механизм выполнить набор записей
// атомарно". Two stores need it: the workout screen, which writes a set log and its session's
// status together (05 · Workout Execution & Logging, "Сохранение данных"), and Start, where an
// active mesocycle without week 1's sessions would be an invalid state (04, "Запуск (Start)").
//
// The repositories handed to `work` are the ones bound to the transaction; a caller must never
// be able to observe a partially-written state, however the medium underneath achieves that.

export function describeTransactionContract(harness: RepositoryHarness): void {
  describe('WorkoutStore', () => {
    const repositories = useRepositories(harness);

    beforeEach(async () => {
      await repositories().mesocycleRepo.create(makeMesocycle());
      await repositories().exerciseRepo.seedCatalog(1, [
        makeCatalogExercise('exercise-bench-press'),
      ]);
    });

    test('writes made inside a transaction are visible through repos once it resolves', async () => {
      const { workoutStore } = repositories();

      await workoutStore.transaction(async (repos) => {
        await repos.sessionRepo.create(makeSession());
        await repos.sessionExerciseRepo.create(makeSessionExercise());
        await repos.setLogRepo.create(makeSetLog());
      });

      await expect(workoutStore.repos.sessionRepo.getById('session-1')).resolves.toEqual(
        makeSession(),
      );
      await expect(workoutStore.repos.setLogRepo.listBySessionId('session-1')).resolves.toEqual([
        makeSetLog(),
      ]);
    });

    test('a failure partway through rolls back writes across every workout repository', async () => {
      const { workoutStore } = repositories();
      await workoutStore.repos.sessionRepo.create(makeSession());
      await workoutStore.repos.sessionExerciseRepo.create(makeSessionExercise());

      await expect(
        workoutStore.transaction(async (repos) => {
          await repos.sessionRepo.update(makeSession({ status: 'in_progress' }));
          await repos.setLogRepo.create(makeSetLog());
          throw new Error('failure partway through');
        }),
      ).rejects.toThrow('failure partway through');

      await expect(workoutStore.repos.sessionRepo.getById('session-1')).resolves.toEqual(
        makeSession(),
      );
      await expect(workoutStore.repos.setLogRepo.listBySessionId('session-1')).resolves.toEqual([]);
    });
  });

  describe('MesocycleStartStore', () => {
    const repositories = useRepositories(harness);

    test('writes made inside a transaction are visible through repos once it resolves', async () => {
      const { mesocycleStartStore } = repositories();
      const planned = makeMesocycle({ status: 'planned' });
      await mesocycleStartStore.repos.mesocycleRepo.create(planned);

      await mesocycleStartStore.transaction(async (repos) => {
        await repos.sessionRepo.create(makeSession());
        await repos.mesocycleRepo.update({ ...planned, status: 'active' });
      });

      await expect(mesocycleStartStore.repos.sessionRepo.getById('session-1')).resolves.toEqual(
        makeSession(),
      );
      await expect(mesocycleStartStore.repos.mesocycleRepo.getActive()).resolves.toMatchObject({
        id: planned.id,
      });
    });

    test('a failure partway through rolls back the mesocycle and its sessions alike', async () => {
      const { mesocycleStartStore } = repositories();
      const planned = makeMesocycle({ status: 'planned' });
      await mesocycleStartStore.repos.mesocycleRepo.create(planned);

      await expect(
        mesocycleStartStore.transaction(async (repos) => {
          await repos.sessionRepo.create(makeSession());
          await repos.mesocycleRepo.update({ ...planned, status: 'active' });
          throw new Error('failure partway through');
        }),
      ).rejects.toThrow('failure partway through');

      await expect(mesocycleStartStore.repos.mesocycleRepo.getById(planned.id)).resolves.toEqual(
        planned,
      );
      await expect(mesocycleStartStore.repos.sessionRepo.listByMesoId(planned.id)).resolves.toEqual(
        [],
      );
    });
  });
}
