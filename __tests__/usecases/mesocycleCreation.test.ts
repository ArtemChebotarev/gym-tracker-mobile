import type { WeekPlan } from '@domain/plan';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import { InMemorySessionRepository } from '@storage/session';
import { InMemoryStore } from '@storage/store';
import { confirmScratchMesocycleDraft } from '@usecases/mesocycleCreation';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const twoDayWeekPlan: WeekPlan = {
  days: [
    { dayNumber: 1, name: '', exercises: [{ exerciseId: 'exercise-bench-press', order: 1, sets: 3 }] },
    { dayNumber: 2, name: '', exercises: [{ exerciseId: 'exercise-squat', order: 1, sets: 4 }] },
  ],
};

function makeDeps() {
  const store = new InMemoryStore();
  return {
    mesocycleRepo: new InMemoryMesocycleRepository(store),
    sessionRepo: new InMemorySessionRepository(store),
  };
}

describe('confirmScratchMesocycleDraft', () => {
  test('saves a planned mesocycle with the correct origin and no startDate', async () => {
    const deps = makeDeps();

    const saved = await confirmScratchMesocycleDraft(
      { name: 'Push/Pull/Legs', lengthWeeks: 6, daysPerWeek: 2, weekPlan: twoDayWeekPlan },
      deps,
    );

    expect(saved.status).toBe('planned');
    expect(saved.startDate).toBeUndefined();
    expect(saved.origin).toEqual({ type: 'scratch' });
    await expect(deps.mesocycleRepo.getById(saved.id)).resolves.toEqual(saved);
  });

  test('creates no Session for the confirmed mesocycle', async () => {
    const deps = makeDeps();

    const saved = await confirmScratchMesocycleDraft(
      { name: 'Push/Pull/Legs', lengthWeeks: 6, daysPerWeek: 2, weekPlan: twoDayWeekPlan },
      deps,
    );

    await expect(deps.sessionRepo.listByMesoId(saved.id)).resolves.toEqual([]);
  });

  test('confirming the same draft input twice creates two independent records, not an update', async () => {
    const deps = makeDeps();
    const input = { name: 'Push/Pull/Legs', lengthWeeks: 6, daysPerWeek: 2, weekPlan: twoDayWeekPlan };

    const first = await confirmScratchMesocycleDraft(input, deps);
    const second = await confirmScratchMesocycleDraft(input, deps);

    expect(first.id).not.toBe(second.id);
    await expect(deps.mesocycleRepo.getAll()).resolves.toEqual(
      expect.arrayContaining([first, second]),
    );
    await expect(deps.mesocycleRepo.getAll()).resolves.toHaveLength(2);
  });
});
