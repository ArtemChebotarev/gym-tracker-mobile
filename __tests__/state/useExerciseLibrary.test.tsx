import { waitFor } from '@testing-library/react-native';

import { seedExerciseCatalog } from '../fixtures/appStorage';
import { renderHookWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';
import { useExerciseLibrary } from '@state/useExerciseLibrary';
import { createCustomExercise, hideExercise } from '@usecases/exerciseLibrary';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const repositories = withRepositories();

beforeEach(async () => {
  await seedExerciseCatalog(repositories());
});

describe('useExerciseLibrary', () => {
  test('groups the catalog by muscle group, in catalog order', async () => {
    const { result } = renderHookWithRepositories(() => useExerciseLibrary({}));

    await waitFor(() => expect(result.current.isPending).toBe(false));

    const groups = result.current.data ?? [];
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0]?.muscleGroup).toBe('chest');
  });

  test('excludes an exercise once it has been hidden', async () => {
    const created = await createCustomExercise(
      { name: 'Hook Test Hidden Exercise', muscleGroup: 'chest' },
      repositories(),
    );
    await hideExercise(created.id, repositories());

    const { result } = renderHookWithRepositories(() =>
      useExerciseLibrary({ search: 'Hook Test Hidden Exercise' }),
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.data).toEqual([]);
  });

  test('applies a case-insensitive search filter', async () => {
    await createCustomExercise(
      { name: 'Unique Search Target', muscleGroup: 'back' },
      repositories(),
    );

    const { result } = renderHookWithRepositories(() =>
      useExerciseLibrary({ search: 'unique search target' }),
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));

    const names = (result.current.data ?? []).flatMap((group) =>
      group.entries.map((entry) => entry.exercise.name),
    );
    expect(names).toEqual(['Unique Search Target']);
  });
});
