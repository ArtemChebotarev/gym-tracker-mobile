import { waitFor } from '@testing-library/react-native';

import { renderHookWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';
import { useCreateCustomExercise } from '@state/useCreateCustomExercise';
import { useExerciseLibrary } from '@state/useExerciseLibrary';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

withRepositories();

describe('useCreateCustomExercise', () => {
  test('persists the exercise through the usecase layer', async () => {
    const { result } = renderHookWithRepositories(() => useCreateCustomExercise());

    result.current.mutate({ name: 'Hook Created Exercise', muscleGroup: 'chest' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.name).toBe('Hook Created Exercise');
    expect(result.current.data?.source).toBe('custom');
  });

  test('invalidates the exercise-library query on success, so the list picks it up', async () => {
    const { result: libraryResult } = renderHookWithRepositories(() =>
      useExerciseLibrary({ search: 'Hook Invalidation Target' }),
    );
    await waitFor(() => expect(libraryResult.current.isPending).toBe(false));
    expect(libraryResult.current.data).toEqual([]);

    const { result: createResult } = renderHookWithRepositories(() => useCreateCustomExercise());
    createResult.current.mutate({ name: 'Hook Invalidation Target', muscleGroup: 'back' });

    await waitFor(() => {
      const names = (libraryResult.current.data ?? []).flatMap((group) =>
        group.entries.map((entry) => entry.exercise.name),
      );
      expect(names).toEqual(['Hook Invalidation Target']);
    });
  });
});
