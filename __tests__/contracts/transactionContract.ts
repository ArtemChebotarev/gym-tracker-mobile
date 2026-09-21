import {
  makeCatalogExercise,
  makeMesocycle,
  makeSession,
  makeSessionExercise,
  makeSetLog,
} from './fixtures';
import { type RepositoryHarness, useRepositories } from './harness';

// Atomicity — 07 · Persistence Layer Contract, rule 6: "Есть механизм выполнить набор записей
// атомарно". Three stores need it: the workout screen, which writes a set log and its session's
// status together (05 · Workout Execution & Logging, "Сохранение данных"); Start, where an active
// mesocycle without week 1's sessions would be an invalid state (04, "Запуск (Start)"); and
// closing a block (052), where an abandoned mesocycle still holding a session `in_progress` would
// be another (05, "Остановить мезоцикл").
//
// The repositories handed to `work` are the ones bound to the transaction; a caller must never
// be able to observe a partially-written state, however the medium underneath achieves that.

export function describeTransactionContract(harness: RepositoryHarness): void {
  describe('WorkoutStore', () => {
    const repositories = useRepositories(harness);

    beforeEach(async () => {
      await repositories().mesocycleRepo.create(makeMesocycle());
      await repositories().exerciseRepo.seedCatalog([makeCatalogExercise('exercise-bench-press')]);
    });

    test('writes made inside a transaction are visible through repos once it resolves', async () => {
      const { workoutStore } = repositories();

      const written = await workoutStore.transaction(async (repos) => {
        const session = await repos.sessionRepo.create(makeSession());
        await repos.sessionExerciseRepo.create(makeSessionExercise());
        return { session, setLog: await repos.setLogRepo.create(makeSetLog()) };
      });

      await expect(workoutStore.repos.sessionRepo.getById('session-1')).resolves.toEqual(
        written.session,
      );
      await expect(workoutStore.repos.setLogRepo.listBySessionId('session-1')).resolves.toEqual([
        written.setLog,
      ]);
    });

    test('a failure partway through rolls back writes across every workout repository', async () => {
      const { workoutStore } = repositories();
      const session = await workoutStore.repos.sessionRepo.create(makeSession());
      await workoutStore.repos.sessionExerciseRepo.create(makeSessionExercise());

      await expect(
        workoutStore.transaction(async (repos) => {
          await repos.sessionRepo.update({ ...session, status: 'in_progress' });
          await repos.setLogRepo.create(makeSetLog());
          throw new Error('failure partway through');
        }),
      ).rejects.toThrow('failure partway through');

      await expect(workoutStore.repos.sessionRepo.getById('session-1')).resolves.toEqual(session);
      await expect(workoutStore.repos.setLogRepo.listBySessionId('session-1')).resolves.toEqual([]);
    });
  });

  describe('MesocycleClosingStore', () => {
    const repositories = useRepositories(harness);

    test('the block and the sessions it ends are visible together once it resolves', async () => {
      const { mesocycleClosingStore } = repositories();
      const active = await mesocycleClosingStore.repos.mesocycleRepo.create(makeMesocycle());
      const session = await mesocycleClosingStore.repos.sessionRepo.create(makeSession());

      await mesocycleClosingStore.transaction(async (repos) => {
        await repos.sessionRepo.update({ ...session, status: 'skipped' });
        await repos.mesocycleRepo.update({ ...active, status: 'abandoned' });
      });

      await expect(mesocycleClosingStore.repos.mesocycleRepo.getActive()).resolves.toBeNull();
      await expect(
        mesocycleClosingStore.repos.sessionRepo.getById('session-1'),
      ).resolves.toMatchObject({ status: 'skipped' });
    });

    test('a failure partway through rolls back the block and its sessions alike', async () => {
      const { mesocycleClosingStore } = repositories();
      const active = await mesocycleClosingStore.repos.mesocycleRepo.create(makeMesocycle());
      const session = await mesocycleClosingStore.repos.sessionRepo.create(makeSession());

      await expect(
        mesocycleClosingStore.transaction(async (repos) => {
          await repos.sessionRepo.update({ ...session, status: 'skipped' });
          await repos.mesocycleRepo.update({ ...active, status: 'abandoned' });
          throw new Error('failure partway through');
        }),
      ).rejects.toThrow('failure partway through');

      await expect(mesocycleClosingStore.repos.mesocycleRepo.getById(active.id)).resolves.toEqual(
        active,
      );
      await expect(mesocycleClosingStore.repos.sessionRepo.getById('session-1')).resolves.toEqual(
        session,
      );
    });
  });

  describe('MesocycleStartStore', () => {
    const repositories = useRepositories(harness);

    test('writes made inside a transaction are visible through repos once it resolves', async () => {
      const { mesocycleStartStore } = repositories();
      const planned = await mesocycleStartStore.repos.mesocycleRepo.create(
        makeMesocycle({ status: 'planned' }),
      );

      const session = await mesocycleStartStore.transaction(async (repos) => {
        const created = await repos.sessionRepo.create(makeSession());
        await repos.mesocycleRepo.update({ ...planned, status: 'active' });
        return created;
      });

      await expect(mesocycleStartStore.repos.sessionRepo.getById('session-1')).resolves.toEqual(
        session,
      );
      await expect(mesocycleStartStore.repos.mesocycleRepo.getActive()).resolves.toMatchObject({
        id: planned.id,
      });
    });

    test('a failure partway through rolls back the mesocycle and its sessions alike', async () => {
      const { mesocycleStartStore } = repositories();
      const planned = await mesocycleStartStore.repos.mesocycleRepo.create(
        makeMesocycle({ status: 'planned' }),
      );

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
