import { NotFoundError } from '@domain/errors';

import {
  makeMesocycle,
  makeSession,
  makeSessionExercise,
  makeSetLog,
  seedParents,
} from './fixtures';
import { type RepositoryHarness, useRepositories } from './harness';

// MesocycleRepository — see 07 · Persistence Layer Contract, "MesocycleRepository", and
// repositories/mesocycle.ts.

export function describeMesocycleContract(harness: RepositoryHarness): void {
  describe('MesocycleRepository', () => {
    const repositories = useRepositories(harness);

    beforeEach(async () => {
      await seedParents(repositories(), { exerciseIds: ['exercise-bench-press'] });
    });

    test('create, getById and getAll round-trip a mesocycle', async () => {
      const { mesocycleRepo } = repositories();
      const mesocycle = makeMesocycle();

      await mesocycleRepo.create(mesocycle);

      await expect(mesocycleRepo.getById(mesocycle.id)).resolves.toEqual(mesocycle);
      await expect(mesocycleRepo.getAll()).resolves.toEqual([mesocycle]);
      await expect(mesocycleRepo.getById('missing')).resolves.toBeNull();
    });

    test('getActive returns the single active mesocycle, or null when none is active', async () => {
      const { mesocycleRepo } = repositories();
      await mesocycleRepo.create(makeMesocycle({ id: 'meso-done', status: 'completed' }));

      await expect(mesocycleRepo.getActive()).resolves.toBeNull();

      const active = makeMesocycle({ id: 'meso-active', status: 'active' });
      await mesocycleRepo.create(active);

      await expect(mesocycleRepo.getActive()).resolves.toEqual(active);
    });

    test('update replaces the stored mesocycle', async () => {
      const { mesocycleRepo } = repositories();
      await mesocycleRepo.create(makeMesocycle());

      const updated = await mesocycleRepo.update(
        makeMesocycle({ status: 'completed', completedAt: '2026-02-16T00:00:00.000Z' }),
      );

      expect(updated.status).toBe('completed');
      await expect(mesocycleRepo.getById('meso-a')).resolves.toEqual(updated);
    });

    test('deleteWithChildren removes the mesocycle and every session, exercise and set log under it', async () => {
      const { mesocycleRepo, sessionRepo, sessionExerciseRepo, setLogRepo } = repositories();
      await mesocycleRepo.create(makeMesocycle());
      await sessionRepo.create(makeSession({ status: 'completed' }));
      await sessionExerciseRepo.create(makeSessionExercise());
      await setLogRepo.create(makeSetLog());

      // A sibling mesocycle's data must survive the cascade untouched.
      const otherMesocycle = makeMesocycle({ id: 'meso-b' });
      const otherSession = makeSession({ id: 'session-2', mesoId: 'meso-b' });
      await mesocycleRepo.create(otherMesocycle);
      await sessionRepo.create(otherSession);

      await mesocycleRepo.deleteWithChildren('meso-a');

      await expect(mesocycleRepo.getById('meso-a')).resolves.toBeNull();
      await expect(sessionRepo.getById('session-1')).resolves.toBeNull();
      await expect(sessionExerciseRepo.listBySessionId('session-1')).resolves.toEqual([]);
      await expect(setLogRepo.listBySessionExerciseId('session-exercise-1')).resolves.toEqual([]);

      await expect(mesocycleRepo.getById('meso-b')).resolves.toEqual(otherMesocycle);
      await expect(sessionRepo.getById('session-2')).resolves.toEqual(otherSession);
    });

    test('deleteWithChildren rejects with NotFoundError for a mesocycle that does not exist', async () => {
      const { mesocycleRepo, sessionRepo } = repositories();
      await mesocycleRepo.create(makeMesocycle());
      await sessionRepo.create(makeSession());

      await expect(mesocycleRepo.deleteWithChildren('missing')).rejects.toBeInstanceOf(
        NotFoundError,
      );

      // Nothing of the mesocycle it never found may be gone either.
      await expect(mesocycleRepo.getById('meso-a')).resolves.toEqual(makeMesocycle());
      await expect(sessionRepo.getById('session-1')).resolves.toEqual(makeSession());
    });
  });
}
