import { NotFoundError } from '@domain/errors';

import {
  makeCatalogExercise,
  makeRoundLog,
  makeSession,
  makeSessionExercise,
  seedParents,
} from './fixtures';
import { type RepositoryHarness, useRepositories } from './harness';
import { ANY_STAMPS } from '../fixtures/stamps';

// RoundLogRepository — the interval round and cooldown counterpart of SetLogRepository
// (10 · Hybrid Exercises, 10.1 FR-7), and repositories/roundLogRepository.ts for the contract.

const HEAVY_BAG = 'exercise-heavy-bag';
const JUMP_ROPE = 'exercise-jump-rope';

export function describeRoundLogContract(harness: RepositoryHarness): void {
  describe('RoundLogRepository', () => {
    const repositories = useRepositories(harness);

    beforeEach(async () => {
      const set = repositories();
      await seedParents(set, { mesoIds: ['meso-a'] });
      await set.exerciseRepo.seedCatalog([
        makeCatalogExercise(HEAVY_BAG, { muscleGroup: 'fullBody', type: 'interval' }),
        makeCatalogExercise(JUMP_ROPE, { muscleGroup: 'fullBody', type: 'interval' }),
      ]);
      await set.sessionRepo.createMany([
        makeSession({ id: 'session-1' }),
        makeSession({ id: 'session-2', dayNumber: 2 }),
      ]);
      await set.sessionExerciseRepo.createMany([
        makeSessionExercise({ id: 'se-bag', sessionId: 'session-1', exerciseId: HEAVY_BAG }),
        makeSessionExercise({
          id: 'se-rope',
          sessionId: 'session-1',
          exerciseId: JUMP_ROPE,
          order: 2,
        }),
        makeSessionExercise({ id: 'se-bag-2', sessionId: 'session-2', exerciseId: HEAVY_BAG }),
      ]);
    });

    test('create round-trips a round, optional rest included or left out', async () => {
      const { roundLogRepo } = repositories();

      const withRest = await roundLogRepo.create(
        makeRoundLog({ id: 'round-1', sessionExerciseId: 'se-bag' }),
      );
      const last = await roundLogRepo.create(
        makeRoundLog({
          id: 'round-last',
          sessionExerciseId: 'se-bag',
          roundNumber: 2,
          restSec: undefined,
          restSkipped: true,
          completed: false,
          workSec: 41,
        }),
      );

      expect(withRest).toEqual({ ...makeRoundLog({ id: 'round-1', sessionExerciseId: 'se-bag' }), ...ANY_STAMPS });
      const stored = await roundLogRepo.listBySessionExerciseId('se-bag');
      expect(stored).toEqual([withRest, last]);
      expect(stored[1]).not.toHaveProperty('restSec');
    });

    test('listBySessionExerciseId returns that exercise\'s rounds by round number', async () => {
      const { roundLogRepo } = repositories();
      await roundLogRepo.create(makeRoundLog({ id: 'r2', sessionExerciseId: 'se-bag', roundNumber: 2 }));
      await roundLogRepo.create(makeRoundLog({ id: 'r1', sessionExerciseId: 'se-bag', roundNumber: 1 }));
      await roundLogRepo.create(
        makeRoundLog({ id: 'other', sessionExerciseId: 'se-rope', exerciseId: JUMP_ROPE }),
      );

      const rounds = await roundLogRepo.listBySessionExerciseId('se-bag');

      expect(rounds.map((round) => round.id)).toEqual(['r1', 'r2']);
    });

    test('listBySessionId joins through the session exercise to assemble a whole session', async () => {
      const { roundLogRepo } = repositories();
      await roundLogRepo.create(makeRoundLog({ id: 'in-1', sessionExerciseId: 'se-bag' }));
      await roundLogRepo.create(
        makeRoundLog({ id: 'in-2', sessionExerciseId: 'se-rope', exerciseId: JUMP_ROPE }),
      );
      await roundLogRepo.create(makeRoundLog({ id: 'elsewhere', sessionExerciseId: 'se-bag-2' }));

      const rounds = await roundLogRepo.listBySessionId('session-1');

      expect(rounds.map((round) => round.id).sort()).toEqual(['in-1', 'in-2']);
    });

    test('listByExerciseId sorts by completedAt descending by default and honours limit and order', async () => {
      const { roundLogRepo } = repositories();
      const oldest = await roundLogRepo.create(
        makeRoundLog({ id: 'a', sessionExerciseId: 'se-bag', completedAt: '2026-08-01T08:00:00.000Z' }),
      );
      const middle = await roundLogRepo.create(
        makeRoundLog({ id: 'b', sessionExerciseId: 'se-bag-2', completedAt: '2026-08-15T08:00:00.000Z' }),
      );
      const newest = await roundLogRepo.create(
        makeRoundLog({ id: 'c', sessionExerciseId: 'se-bag-2', roundNumber: 2, completedAt: '2026-08-26T08:00:00.000Z' }),
      );

      await expect(roundLogRepo.listByExerciseId(HEAVY_BAG)).resolves.toEqual([newest, middle, oldest]);
      await expect(roundLogRepo.listByExerciseId(HEAVY_BAG, { order: 'asc', limit: 2 })).resolves.toEqual([
        oldest,
        middle,
      ]);
      await expect(roundLogRepo.listByExerciseId(JUMP_ROPE)).resolves.toEqual([]);
    });

    test('getLastByExerciseId returns the newest round, or null for an exercise never logged', async () => {
      const { roundLogRepo } = repositories();
      await roundLogRepo.create(
        makeRoundLog({ id: 'a', sessionExerciseId: 'se-bag', completedAt: '2026-08-01T08:00:00.000Z' }),
      );
      const newest = await roundLogRepo.create(
        makeRoundLog({ id: 'b', sessionExerciseId: 'se-bag', roundNumber: 2, completedAt: '2026-08-26T08:00:00.000Z' }),
      );

      await expect(roundLogRepo.getLastByExerciseId(HEAVY_BAG)).resolves.toEqual(newest);
      await expect(roundLogRepo.getLastByExerciseId(JUMP_ROPE)).resolves.toBeNull();
    });

    test('update replaces a round, dropping a field the domain left out', async () => {
      const { roundLogRepo } = repositories();
      const stored = await roundLogRepo.create(
        makeRoundLog({ id: 'round-1', sessionExerciseId: 'se-bag' }),
      );

      const { restSec: _restSec, ...withoutRest } = stored;
      const updated = await roundLogRepo.update({ ...withoutRest, workSec: 45, completed: false });

      expect(updated).toMatchObject({ workSec: 45, completed: false });
      expect(updated).not.toHaveProperty('restSec');
      await expect(roundLogRepo.listBySessionExerciseId('se-bag')).resolves.toEqual([updated]);
    });

    test('update and deleteById reject with NotFoundError for a round that does not exist', async () => {
      const { roundLogRepo } = repositories();
      const missing = { ...makeRoundLog({ id: 'missing' }), ...ANY_STAMPS };

      await expect(roundLogRepo.update(missing as never)).rejects.toBeInstanceOf(NotFoundError);
      await expect(roundLogRepo.deleteById('missing')).rejects.toBeInstanceOf(NotFoundError);
    });

    test('deleteById removes just that round', async () => {
      const { roundLogRepo } = repositories();
      await roundLogRepo.create(makeRoundLog({ id: 'keep', sessionExerciseId: 'se-bag' }));
      await roundLogRepo.create(makeRoundLog({ id: 'drop', sessionExerciseId: 'se-bag', roundNumber: 2 }));

      await roundLogRepo.deleteById('drop');

      const rounds = await roundLogRepo.listBySessionExerciseId('se-bag');
      expect(rounds.map((round) => round.id)).toEqual(['keep']);
    });
  });
}
