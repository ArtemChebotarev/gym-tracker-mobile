import { isConflictError, isNotFoundError } from '@domain/errors';
import type { Mesocycle } from '@domain/mesocycle';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { WeekPlan } from '@domain/plan';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import { InMemoryStore } from '@storage/store';
import { editPlannedMesocycle } from '@usecases/mesocycleEditing';
import { STAMPS } from '../fixtures/stamps';

const originalWeekPlan: WeekPlan = {
  days: [
    { dayNumber: 1, name: '', exercises: [{ exerciseId: 'exercise-bench-press', order: 1, sets: 3 }] },
    { dayNumber: 2, name: '', exercises: [{ exerciseId: 'exercise-squat', order: 1, sets: 4 }] },
  ],
};

function makeMesocycle(overrides: Partial<Mesocycle>): Mesocycle {
  return {
    ...STAMPS,
    id: 'meso',
    name: 'Push/Pull',
    lengthWeeks: 6,
    daysPerWeek: 2,
    status: 'planned',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    weekPlan: originalWeekPlan,
    createdAt: '2026-09-01T12:00:00.000Z',
    ...overrides,
  };
}

function makeDeps() {
  return { mesocycleRepo: new InMemoryMesocycleRepository(new InMemoryStore()) };
}

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject.');
}

describe('editPlannedMesocycle', () => {
  test('saves a changed exercise list and startSets over the planned mesocycle', async () => {
    const deps = makeDeps();
    await deps.mesocycleRepo.create(makeMesocycle({ id: 'meso' }));
    const editedWeekPlan: WeekPlan = {
      days: [
        {
          dayNumber: 1,
          name: '',
          exercises: [
            { exerciseId: 'exercise-overhead-press', order: 1, sets: 2 },
            { exerciseId: 'exercise-bench-press', order: 2, sets: 5 },
          ],
        },
        { dayNumber: 2, name: '', exercises: [] },
      ],
    };

    const saved = await editPlannedMesocycle(
      'meso',
      { name: 'Push/Pull', lengthWeeks: 6, daysPerWeek: 2, weekPlan: editedWeekPlan },
      deps,
    );

    expect(saved.weekPlan).toEqual(editedWeekPlan);
    await expect(deps.mesocycleRepo.getById('meso')).resolves.toEqual(saved);
    await expect(deps.mesocycleRepo.getAll()).resolves.toHaveLength(1);
  });

  test.each(['active', 'completed'] as const)(
    'rejects editing a %s mesocycle with a ConflictError and leaves it unchanged',
    async (status) => {
      const deps = makeDeps();
      const existing = makeMesocycle({
        id: 'meso',
        status,
        startDate: '2026-09-02T08:00:00.000Z',
        weekPlan: undefined,
      });
      await deps.mesocycleRepo.create(existing);

      const error = await rejectionOf(
        editPlannedMesocycle(
          'meso',
          { name: 'Renamed', lengthWeeks: 6, daysPerWeek: 2, weekPlan: originalWeekPlan },
          deps,
        ),
      );

      expect(isConflictError(error)).toBe(true);
      await expect(deps.mesocycleRepo.getById('meso')).resolves.toEqual(existing);
    },
  );

  test('rejects an unknown id with a NotFoundError', async () => {
    const deps = makeDeps();

    const error = await rejectionOf(
      editPlannedMesocycle(
        'missing',
        { name: 'Push/Pull', lengthWeeks: 6, daysPerWeek: 2, weekPlan: originalWeekPlan },
        deps,
      ),
    );

    expect(isNotFoundError(error)).toBe(true);
  });
});
