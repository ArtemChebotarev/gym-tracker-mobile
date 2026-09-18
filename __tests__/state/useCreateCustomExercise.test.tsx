import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { useCreateCustomExercise } from '@state/useCreateCustomExercise';
import { useExerciseLibrary } from '@state/useExerciseLibrary';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

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

describe('useCreateCustomExercise', () => {
  test('persists the exercise through the usecase layer', async () => {
    const { result } = renderHook(() => useCreateCustomExercise(), { wrapper });

    result.current.mutate({ name: 'Hook Created Exercise', muscleGroup: 'chest' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.name).toBe('Hook Created Exercise');
    expect(result.current.data?.source).toBe('custom');
  });

  test('invalidates the exercise-library query on success, so the list picks it up', async () => {
    const { result: libraryResult } = renderHook(
      () => useExerciseLibrary({ search: 'Hook Invalidation Target' }),
      { wrapper },
    );
    await waitFor(() => expect(libraryResult.current.isPending).toBe(false));
    expect(libraryResult.current.data).toEqual([]);

    const { result: createResult } = renderHook(() => useCreateCustomExercise(), { wrapper });
    createResult.current.mutate({ name: 'Hook Invalidation Target', muscleGroup: 'back' });

    await waitFor(() => {
      const names = (libraryResult.current.data ?? []).flatMap((group) =>
        group.entries.map((entry) => entry.exercise.name),
      );
      expect(names).toEqual(['Hook Invalidation Target']);
    });
  });
});
