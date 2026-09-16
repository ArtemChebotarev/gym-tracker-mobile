import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { MOCK_MESOCYCLE_IDS } from '@domain/mesocycleMocks';
import { mesocycleListDeps } from '@state/mesocycleStore';
import { useDeletePlannedMesocycle } from '@state/useDeletePlannedMesocycle';
import { useMesocycles } from '@state/useMesocycles';

let client: QueryClient;

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
  test('seeds the three stub mesocycles into the app-wide store', async () => {
    const { result } = renderHook(() => useMesocycles(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.map((mesocycle) => mesocycle.id).sort()).toEqual(
      Object.values(MOCK_MESOCYCLE_IDS).sort(),
    );
  });

  test('deleting the planned mock removes it and refreshes the list without re-seeding it', async () => {
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
      mesocycleListDeps.mesocycleRepo.getById(MOCK_MESOCYCLE_IDS.planned),
    ).resolves.toBeNull();
  });
});
