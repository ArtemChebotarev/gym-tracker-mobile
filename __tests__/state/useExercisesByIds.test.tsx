import { waitFor } from '@testing-library/react-native';

import { toExerciseId } from '@domain/catalog';
import { renderHookWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';
import { useExercisesByIds } from '@state/useExercisesByIds';
import { createCustomExercise } from '@usecases/exerciseLibrary';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const repositories = withRepositories();

describe('useExercisesByIds', () => {
  test('resolves the requested ids into a lookup keyed by id', async () => {
    const created = await createCustomExercise(
      { name: 'Hook Test By Id', muscleGroup: 'chest' },
      repositories(),
    );

    const { result } = renderHookWithRepositories(() => useExercisesByIds([created.id]));

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.data?.[created.id]).toEqual(created);
  });

  test('omits ids that do not resolve to an exercise', async () => {
    const { result } = renderHookWithRepositories(() =>
      useExercisesByIds([toExerciseId('missing')]),
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.data).toEqual({});
  });
});
