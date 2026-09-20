import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { toExerciseId } from '@domain/catalog';
import { useExerciseHistory } from '@state/useExerciseHistory';

import { seedWorkoutFixture } from '../fixtures/workoutFixture';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

let client: QueryClient;

beforeEach(async () => {
  await seedWorkoutFixture();
  // gcTime: 0 avoids leaving a garbage-collection timer open past the test.
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});

afterEach(() => {
  client.clear();
  client.unmount();
});

function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useExerciseHistory', () => {
  test("groups the fixture's completed session under its mesocycle", async () => {
    const { result } = renderHook(
      () => useExerciseHistory(toExerciseId('bench-press-barbell')),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));

    const groups = result.current.data ?? [];
    expect(groups).toHaveLength(1);
    expect(groups[0]?.name).toBe('Upper/Lower');
    // The fixture's week 2 day 1 is still in progress, so only week 1 day 1 is history.
    expect(groups[0]?.sessions.map((session) => session.weekNumber)).toEqual([1]);
  });

  test('is empty for an exercise that was never performed', async () => {
    const { result } = renderHook(
      () => useExerciseHistory(toExerciseId('deadlift-barbell')),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.data).toEqual([]);
  });

  test('does not read at all until it is enabled', async () => {
    const { result } = renderHook(
      () => useExerciseHistory(toExerciseId('bench-press-barbell'), { enabled: false }),
      { wrapper },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });
});
