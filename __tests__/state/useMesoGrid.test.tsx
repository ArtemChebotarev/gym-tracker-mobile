import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { seedMockMesocycles } from '../fixtures/appStorage';
import { MOCK_MESOCYCLE_IDS } from '../fixtures/mesocycleMocks';
import { useMesoGrid } from '@state/useMesoGrid';

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

describe('useMesoGrid', () => {
  test('reads the grid of a mesocycle in storage', async () => {
    const { result } = renderHook(() => useMesoGrid(MOCK_MESOCYCLE_IDS.planned), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const grid = result.current.data!;
    expect(grid.mesoId).toBe(MOCK_MESOCYCLE_IDS.planned);
    expect(grid.weeks).toHaveLength(grid.lengthWeeks);
    expect(grid.weeks.at(-1)?.isDeload).toBe(true);
    expect(
      grid.weeks.flatMap((week) => week.cells).every((cell) => cell.status === 'awaiting'),
    ).toBe(true);
  });

  test('stays idle without a mesocycle id', () => {
    const { result } = renderHook(() => useMesoGrid(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });
});
