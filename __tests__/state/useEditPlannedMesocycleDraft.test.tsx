import { waitFor } from '@testing-library/react-native';

import { isConflictError } from '@domain/errors';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import type { MesoBuilderDraft } from '@state/draftStore';
import { useEditPlannedMesocycleDraft } from '@state/useEditPlannedMesocycleDraft';
import { renderHookWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';
import { ANY_STAMPS, STAMPS } from '../fixtures/stamps';

const PLANNED: Mesocycle = {
  ...STAMPS,
  id: 'edit-hook-planned',
  name: 'Push/Pull',
  lengthWeeks: 6,
  daysPerWeek: 1,
  status: 'planned',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
  weekPlan: {
    days: [
      { dayNumber: 1, name: '', exercises: [{ exerciseId: 'bench-press', order: 0, sets: 3 }] },
    ],
  },
  createdAt: '2026-09-01T12:00:00.000Z',
};

const EDITED_DRAFT: MesoBuilderDraft = {
  name: 'Push/Pull v2',
  lengthWeeks: 5,
  daysPerWeek: 2,
  exercisesByDay: {
    1: [{ exerciseId: 'bench-press', order: 0, sets: 5 }],
    2: [{ exerciseId: 'squat', order: 0, sets: 2 }],
  },
};

const repositories = withRepositories();

describe('useEditPlannedMesocycleDraft', () => {
  test('saves the draft over the planned mesocycle through the edit use case (072)', async () => {
    await repositories().mesocycleRepo.create(PLANNED);
    const { result } = renderHookWithRepositories(() => useEditPlannedMesocycleDraft(PLANNED.id));

    result.current.mutate(EDITED_DRAFT);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const saved = await repositories().mesocycleRepo.getById(PLANNED.id);
    expect(saved).toEqual({
      ...PLANNED,
      ...ANY_STAMPS,
      name: 'Push/Pull v2',
      lengthWeeks: 5,
      daysPerWeek: 2,
      weekPlan: {
        days: [
          { dayNumber: 1, name: '', exercises: [{ exerciseId: 'bench-press', order: 0, sets: 5 }] },
          { dayNumber: 2, name: '', exercises: [{ exerciseId: 'squat', order: 0, sets: 2 }] },
        ],
      },
    });
  });

  test('surfaces editing a non-planned mesocycle as a ConflictError', async () => {
    const active: Mesocycle = {
      ...PLANNED,
      id: 'edit-hook-active',
      status: 'active',
      startDate: '2026-09-02T08:00:00.000Z',
      weekPlan: undefined,
    };
    await repositories().mesocycleRepo.create(active);
    const { result } = renderHookWithRepositories(() => useEditPlannedMesocycleDraft(active.id));

    result.current.mutate(EDITED_DRAFT);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(isConflictError(result.current.error)).toBe(true);
  });
});
