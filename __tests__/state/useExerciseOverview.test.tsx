import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { toExerciseId } from '@domain/catalog';
import { useExerciseOverview } from '@state/useExerciseOverview';

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

describe('useExerciseOverview', () => {
  test('reads a seeded catalog exercise with the sets the fixture logged for it', async () => {
    const { result } = renderHook(
      () => useExerciseOverview(toExerciseId('bench-press-barbell')),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.data?.exercise.name).toBe('Bench Press');
    expect(result.current.data?.stats?.setCount).toBeGreaterThan(0);
    expect(result.current.data?.actions).toEqual(['hide']);
  });

  test('an exercise with no sets has no stats', async () => {
    const { result } = renderHook(() => useExerciseOverview(toExerciseId('deadlift-barbell')), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.data?.stats).toBeNull();
    expect(result.current.data?.lastSession).toBeNull();
  });

  test('resolves to null for an id no exercise carries', async () => {
    const { result } = renderHook(() => useExerciseOverview(toExerciseId('no-such-exercise')), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.data).toBeNull();
  });
});
