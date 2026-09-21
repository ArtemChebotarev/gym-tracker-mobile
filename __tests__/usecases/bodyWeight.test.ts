import { isNotFoundError } from '@domain/errors';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { SqliteMesocycleRepository } from '@storage/sqlite/mesocycle';
import { setBodyWeight } from '@usecases/bodyWeight';
import { ANY_STAMPS, STAMPS } from '../fixtures/stamps';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

const mesocycle: Mesocycle = {
  ...STAMPS,
  id: 'meso-1',
  name: 'Upper/Lower',
  lengthWeeks: 4,
  daysPerWeek: 2,
  status: 'active',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
  weekPlan: { days: [] },
  createdAt: '2026-09-01T00:00:00.000Z',
};

async function setUp() {
  const repo = new SqliteMesocycleRepository(db());
  await repo.create(mesocycle);
  return repo;
}

describe('setBodyWeight', () => {
  test('DoD: stores the body weight on the mesocycle', async () => {
    const repo = await setUp();

    const saved = await setBodyWeight({ mesoId: 'meso-1', bodyWeight: 80 }, repo);

    expect(saved.bodyWeight).toBe(80);
    expect((await repo.getById('meso-1'))?.bodyWeight).toBe(80);
  });

  test('DoD: a later value replaces the earlier one', async () => {
    const repo = await setUp();
    await setBodyWeight({ mesoId: 'meso-1', bodyWeight: 80 }, repo);

    await setBodyWeight({ mesoId: 'meso-1', bodyWeight: 82.5 }, repo);

    expect((await repo.getById('meso-1'))?.bodyWeight).toBe(82.5);
  });

  test('leaves the rest of the mesocycle alone', async () => {
    const repo = await setUp();

    const saved = await setBodyWeight({ mesoId: 'meso-1', bodyWeight: 80 }, repo);

    expect({ ...saved, bodyWeight: undefined }).toEqual({
      ...mesocycle,
      ...ANY_STAMPS,
      bodyWeight: undefined,
    });
  });

  test.each([0, -1, Number.NaN])('rejects %p — that is not a body weight', async (weight) => {
    const repo = await setUp();

    await expect(setBodyWeight({ mesoId: 'meso-1', bodyWeight: weight }, repo)).rejects.toThrow();
    expect((await repo.getById('meso-1'))?.bodyWeight).toBeUndefined();
  });

  test('a mesocycle that does not exist is a NotFound', async () => {
    const repo = await setUp();
    expect.assertions(1);

    try {
      await setBodyWeight({ mesoId: 'nope', bodyWeight: 80 }, repo);
    } catch (error) {
      expect(isNotFoundError(error)).toBe(true);
    }
  });
});
