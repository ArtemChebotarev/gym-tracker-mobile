import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { seedExerciseCatalog } from '../fixtures/appStorage';
import { exerciseLibraryDeps } from '@state/exerciseLibraryStore';
import { useExerciseLibrary } from '@state/useExerciseLibrary';
import { createCustomExercise, hideExercise } from '@usecases/exerciseLibrary';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

let client: QueryClient;

beforeAll(async () => {
  await seedExerciseCatalog();
});

beforeEach(() => {
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

describe('useExerciseLibrary', () => {
  test('groups the catalog by muscle group, in catalog order', async () => {
    const { result } = renderHook(() => useExerciseLibrary({}), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    const groups = result.current.data ?? [];
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0]?.muscleGroup).toBe('chest');
  });

  test('excludes an exercise once it has been hidden', async () => {
    const created = await createCustomExercise(
      { name: 'Hook Test Hidden Exercise', muscleGroup: 'chest' },
      exerciseLibraryDeps(),
    );
    await hideExercise(created.id, exerciseLibraryDeps());

    const { result } = renderHook(
      () => useExerciseLibrary({ search: 'Hook Test Hidden Exercise' }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.data).toEqual([]);
  });

  test('applies a case-insensitive search filter', async () => {
    await createCustomExercise(
      { name: 'Unique Search Target', muscleGroup: 'back' },
      exerciseLibraryDeps(),
    );

    const { result } = renderHook(() => useExerciseLibrary({ search: 'unique search target' }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    const names = (result.current.data ?? []).flatMap((group) =>
      group.entries.map((entry) => entry.exercise.name),
    );
    expect(names).toEqual(['Unique Search Target']);
  });
});
