import { makeSession, makeSessionExercise, seedParents } from './fixtures';
import { type RepositoryHarness, useRepositories } from './harness';

// SessionExerciseRepository — see 07 · Persistence Layer Contract, "SessionExerciseRepository",
// and repositories/sessionExercise.ts.

export function describeSessionExerciseContract(harness: RepositoryHarness): void {
  describe('SessionExerciseRepository', () => {
    const repositories = useRepositories(harness);

    beforeEach(async () => {
      await seedParents(repositories(), {
        mesoIds: ['meso-a'],
        exerciseIds: ['exercise-bench-press'],
      });
    });

    test('listBySessionId returns only the exercises planned within that session', async () => {
      const { sessionRepo, sessionExerciseRepo } = repositories();
      await sessionRepo.createMany([makeSession(), makeSession({ id: 'session-2', dayNumber: 2 })]);
      await sessionExerciseRepo.createMany([
        makeSessionExercise({ id: 'se-1' }),
        makeSessionExercise({ id: 'se-2', order: 2 }),
        makeSessionExercise({ id: 'se-other', sessionId: 'session-2' }),
      ]);

      const exercises = await sessionExerciseRepo.listBySessionId('session-1');

      expect(exercises.map((exercise) => exercise.id).sort()).toEqual(['se-1', 'se-2']);
    });

    test('create and update round-trip a session exercise', async () => {
      const { sessionRepo, sessionExerciseRepo } = repositories();
      await sessionRepo.create(makeSession());
      await sessionExerciseRepo.create(makeSessionExercise());

      const updated = await sessionExerciseRepo.update(
        makeSessionExercise({ order: 3, status: 'completed' }),
      );

      await expect(sessionExerciseRepo.listBySessionId('session-1')).resolves.toEqual([updated]);
    });

    test('updateMany replaces several session exercises in one call, e.g. a reorder', async () => {
      const { sessionRepo, sessionExerciseRepo } = repositories();
      await sessionRepo.create(makeSession());
      await sessionExerciseRepo.createMany([
        makeSessionExercise({ id: 'se-1', order: 1 }),
        makeSessionExercise({ id: 'se-2', order: 2 }),
      ]);

      const reordered = await sessionExerciseRepo.updateMany([
        makeSessionExercise({ id: 'se-1', order: 2 }),
        makeSessionExercise({ id: 'se-2', order: 1 }),
      ]);

      expect(reordered.map((exercise) => exercise.order)).toEqual([2, 1]);
      const stored = await sessionExerciseRepo.listBySessionId('session-1');
      expect(stored.find((exercise) => exercise.id === 'se-1')?.order).toBe(2);
      expect(stored.find((exercise) => exercise.id === 'se-2')?.order).toBe(1);
    });

    test('deleteById removes a session exercise', async () => {
      const { sessionRepo, sessionExerciseRepo } = repositories();
      await sessionRepo.create(makeSession());
      await sessionExerciseRepo.create(makeSessionExercise());

      await sessionExerciseRepo.deleteById('session-exercise-1');

      await expect(sessionExerciseRepo.listBySessionId('session-1')).resolves.toEqual([]);
    });
  });
}
