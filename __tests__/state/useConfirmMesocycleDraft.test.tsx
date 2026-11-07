import { waitFor } from '@testing-library/react-native';

import type { MesoBuilderDraft } from '@state/draftStore';
import { setTelemetryClient } from '@state/telemetry';
import { renderHookWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';
import { useConfirmMesocycleDraft } from '@state/useConfirmMesocycleDraft';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const DRAFT: MesoBuilderDraft = {
  name: 'Push/Pull',
  lengthWeeks: 6,
  daysPerWeek: 2,
  exercisesByDay: {
    1: [{ exerciseId: 'bench-press', order: 0, sets: 3 }],
    2: [{ exerciseId: 'squat', order: 0, sets: 2 }],
  },
};

const repositories = withRepositories();

describe('useConfirmMesocycleDraft', () => {
  test('saves the draft as a planned mesocycle through Confirm (071)', async () => {
    const { result } = renderHookWithRepositories(() => useConfirmMesocycleDraft());

    result.current.mutate(DRAFT);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const saved = result.current.data!;
    expect(saved.status).toBe('planned');
    expect(saved.origin).toEqual({ type: 'scratch' });
    expect(saved.weekPlan?.days).toHaveLength(2);
    await expect(repositories().mesocycleRepo.getById(saved.id)).resolves.toEqual(saved);
  });

  test('reports the new cycle to telemetry with the flow it came from', async () => {
    const capture = jest.fn();
    setTelemetryClient({ capture });
    const { result } = renderHookWithRepositories(() => useConfirmMesocycleDraft());

    result.current.mutate(DRAFT);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    setTelemetryClient(undefined);

    expect(capture).toHaveBeenCalledWith('cycle_created', { source: 'scratch' });
  });

  test('creates no Session', async () => {
    const { result } = renderHookWithRepositories(() => useConfirmMesocycleDraft());

    result.current.mutate(DRAFT);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const { sessionRepo } = repositories();
    await expect(sessionRepo.listByMesoId(result.current.data!.id)).resolves.toEqual([]);
  });

  test('surfaces a failed save as a mutation error', async () => {
    const { result } = renderHookWithRepositories(() => useConfirmMesocycleDraft());

    // daysPerWeek out of range — buildScratchMesocycleDraft rejects it before anything is saved.
    result.current.mutate({ ...DRAFT, daysPerWeek: 8 });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toMatch(/daysPerWeek must be between 1 and 7/);
  });
});
