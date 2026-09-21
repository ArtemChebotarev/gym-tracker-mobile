import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { seedExerciseCatalog, seedMockMesocycles } from '../fixtures/appStorage';
import { MOCK_MESOCYCLE_IDS } from '../fixtures/mesocycleMocks';
import { useMesocycles } from '@state/useMesocycles';
import { useStartMesocycle } from '@state/useStartMesocycle';
import { useTodayWorkout } from '@state/useWorkoutSession';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

let client: QueryClient;

beforeAll(async () => {
  await seedExerciseCatalog();
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

describe('useStartMesocycle', () => {
  test('starting the planned mock makes it active, and Today opens its Week 1 Day 1', async () => {
    const { result } = renderHook(
      () => ({ list: useMesocycles(), today: useTodayWorkout(), start: useStartMesocycle() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.today.data?.kind).toBe('noActiveMesocycle'));

    act(() => result.current.start.mutate(MOCK_MESOCYCLE_IDS.planned));

    await waitFor(() => expect(result.current.start.isSuccess).toBe(true));
    await waitFor(() =>
      expect(
        result.current.list.data?.find((mesocycle) => mesocycle.id === MOCK_MESOCYCLE_IDS.planned)
          ?.status,
      ).toBe('active'),
    );
    await waitFor(() => expect(result.current.today.data?.kind).toBe('session'));
    const today = result.current.today.data;
    if (today?.kind !== 'session') {
      throw new Error('Expected a session.');
    }
    expect(today.model.mode).toBe('live');
    expect(today.model.header).toMatchObject({
      weekNumber: 1,
      dayNumber: 1,
      mesocycleName: 'Upper/Lower',
    });
    expect(today.model.exercises.map((exercise) => exercise.name)).toEqual([
      'Bench Press',
      'Barbell Row',
      'Shoulder Press',
    ]);
  });
});
