import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { toExerciseId } from '@domain/catalog';
import { exerciseLibraryDeps } from '@state/exerciseLibraryStore';
import { useExercisesByIds } from '@state/useExercisesByIds';
import { createCustomExercise } from '@usecases/exerciseLibrary';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});

afterEach(() => {
  client.clear();
  client.unmount();
});

function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useExercisesByIds', () => {
  test('resolves the requested ids into a lookup keyed by id', async () => {
    const created = await createCustomExercise(
      { name: 'Hook Test By Id', muscleGroup: 'chest' },
      exerciseLibraryDeps(),
    );

    const { result } = renderHook(() => useExercisesByIds([created.id]), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.data?.[created.id]).toEqual(created);
  });

  test('omits ids that do not resolve to an exercise', async () => {
    const { result } = renderHook(() => useExercisesByIds([toExerciseId('missing')]), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.data).toEqual({});
  });
});
