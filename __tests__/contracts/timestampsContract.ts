import { makeMesocycle, makeSession, seedParents } from './fixtures';
import { type RepositoryHarness, useRepositories } from './harness';

// `createdAt` / `updatedAt` on every record — 07 · Persistence Layer Contract, "Подготовка к
// backend". The adapter writes them, not the domain (domain/timestamps.ts), which is what makes
// this part of the contract rather than of any one caller's discipline.
//
// Sessions stand in for every entity here: the stamps are storage's business and work the same
// whatever the row holds, so the rules are stated once instead of eleven times.

/**
 * SQLite and JavaScript both keep time to the millisecond, so two writes can land on the same
 * instant. A test that means "the stamp moved" has to let the clock move first.
 */
function afterAMoment(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 2));
}

export function describeTimestampsContract(harness: RepositoryHarness): void {
  describe('record timestamps', () => {
    const repositories = useRepositories(harness);

    beforeEach(async () => {
      await seedParents(repositories(), { mesoIds: ['meso-a'] });
    });

    test('a created record carries both stamps, equal to each other', async () => {
      const session = await repositories().sessionRepo.create(makeSession());

      expect(session.createdAt).toEqual(expect.any(String));
      expect(session.updatedAt).toBe(session.createdAt);
      expect(Number.isNaN(Date.parse(session.createdAt))).toBe(false);
    });

    test('the stamps come back with the record, not just from the write', async () => {
      const created = await repositories().sessionRepo.create(makeSession());

      await expect(repositories().sessionRepo.getById(created.id)).resolves.toEqual(created);
    });

    test('an update moves updatedAt and leaves createdAt alone', async () => {
      const { sessionRepo } = repositories();
      const created = await sessionRepo.create(makeSession());
      await afterAMoment();

      const updated = await sessionRepo.update({ ...created, status: 'in_progress' });

      expect(updated.createdAt).toBe(created.createdAt);
      expect(updated.updatedAt > created.updatedAt).toBe(true);
      await expect(sessionRepo.getById(created.id)).resolves.toEqual(updated);
    });

    test('createdAt of the stored record wins over whatever the caller passes to update', async () => {
      const { sessionRepo } = repositories();
      const created = await sessionRepo.create(makeSession());

      const updated = await sessionRepo.update({
        ...created,
        createdAt: '1999-01-01T00:00:00.000Z',
        status: 'in_progress',
      });

      expect(updated.createdAt).toBe(created.createdAt);
    });

    test('a record that brings its own stamps keeps them — the restore case', async () => {
      // Importing a backup (task 070) puts records back as they were written, not as of the
      // import: their stamps come from the file.
      const stamps = {
        createdAt: '2026-03-01T08:00:00.000Z',
        updatedAt: '2026-03-02T09:30:00.000Z',
      };

      const restored = await repositories().mesocycleRepo.create({
        ...makeMesocycle({ id: 'meso-restored' }),
        ...stamps,
      });

      expect(restored).toMatchObject(stamps);
      await expect(repositories().mesocycleRepo.getById('meso-restored')).resolves.toMatchObject(
        stamps,
      );
    });
  });
}
