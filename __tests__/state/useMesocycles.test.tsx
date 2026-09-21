import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { seedMockMesocycles } from '../fixtures/appStorage';
import { MOCK_MESOCYCLE_IDS } from '../fixtures/mesocycleMocks';
import { mesocycleListDeps } from '@state/mesocycleStore';
import { useDeletePlannedMesocycle } from '@state/useDeletePlannedMesocycle';
import { useMesocycles } from '@state/useMesocycles';

let client: QueryClient;

beforeAll(async () => {
  await seedMockMesocycles();
});

beforeEach(() => {
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

describe('useMesocycles / useDeletePlannedMesocycle', () => {
  test('lists what storage holds', async () => {
    const { result } = renderHook(() => useMesocycles(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.map((mesocycle) => mesocycle.id).sort()).toEqual(
      Object.values(MOCK_MESOCYCLE_IDS).sort(),
    );
  });

  test('deleting the planned mesocycle removes it and refreshes the list', async () => {
    const { result } = renderHook(
      () => ({ list: useMesocycles(), remove: useDeletePlannedMesocycle() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));

    act(() => result.current.remove.mutate(MOCK_MESOCYCLE_IDS.planned));

    await waitFor(() => expect(result.current.remove.isSuccess).toBe(true));
    await waitFor(() =>
      expect(result.current.list.data!.map((mesocycle) => mesocycle.id)).not.toContain(
        MOCK_MESOCYCLE_IDS.planned,
      ),
    );
    await expect(
      mesocycleListDeps().mesocycleRepo.getById(MOCK_MESOCYCLE_IDS.planned),
    ).resolves.toBeNull();
  });
});
