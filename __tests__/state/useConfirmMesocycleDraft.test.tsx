import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { repositories } from '@state/repositories';
import type { MesoBuilderDraft } from '@state/draftStore';
import { mesocycleCreationDeps } from '@state/mesocycleStore';
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

let client: QueryClient;

beforeEach(() => {
  // mutations.gcTime: 0 too — a mutation's default 5-minute GC timer otherwise keeps jest alive.
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  });
});

afterEach(() => {
  client.clear();
  client.unmount();
});

function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useConfirmMesocycleDraft', () => {
  test('saves the draft as a planned mesocycle through Confirm (071)', async () => {
    const { result } = renderHook(() => useConfirmMesocycleDraft(), { wrapper });

    result.current.mutate(DRAFT);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const saved = result.current.data!;
    expect(saved.status).toBe('planned');
    expect(saved.origin).toEqual({ type: 'scratch' });
    expect(saved.weekPlan?.days).toHaveLength(2);
    await expect(mesocycleCreationDeps().mesocycleRepo.getById(saved.id)).resolves.toEqual(saved);
  });

  test('creates no Session in the app-wide store', async () => {
    const { result } = renderHook(() => useConfirmMesocycleDraft(), { wrapper });

    result.current.mutate(DRAFT);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const { sessionRepo } = repositories();
    await expect(sessionRepo.listByMesoId(result.current.data!.id)).resolves.toEqual([]);
  });

  test('surfaces a failed save as a mutation error', async () => {
    const { result } = renderHook(() => useConfirmMesocycleDraft(), { wrapper });

    // daysPerWeek out of range — buildScratchMesocycleDraft rejects it before anything is saved.
    result.current.mutate({ ...DRAFT, daysPerWeek: 8 });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toMatch(/daysPerWeek must be between 1 and 7/);
  });
});
