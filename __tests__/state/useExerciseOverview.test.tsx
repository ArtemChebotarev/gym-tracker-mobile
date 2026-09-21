import { waitFor } from '@testing-library/react-native';

import { toExerciseId } from '@domain/catalog';
import { useExerciseOverview } from '@state/useExerciseOverview';

import { renderHookWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';
import { seedWorkoutFixture } from '../fixtures/workoutFixture';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const repositories = withRepositories();

beforeEach(async () => {
  await seedWorkoutFixture(repositories());
});

describe('useExerciseOverview', () => {
  test('reads a seeded catalog exercise with the sets the fixture logged for it', async () => {
    const { result } = renderHookWithRepositories(() =>
      useExerciseOverview(toExerciseId('bench-press-barbell')),
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.data?.exercise.name).toBe('Bench Press');
    expect(result.current.data?.stats?.sessionCount).toBeGreaterThan(0);
    expect(result.current.data?.actions).toEqual(['hide']);
  });

  test('an exercise with no sets has no stats', async () => {
    const { result } = renderHookWithRepositories(() =>
      useExerciseOverview(toExerciseId('deadlift-barbell')),
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.data?.stats).toBeNull();
    expect(result.current.data?.lastSession).toBeNull();
    expect(result.current.data?.earlierSessions).toEqual([]);
  });

  test('resolves to null for an id no exercise carries', async () => {
    const { result } = renderHookWithRepositories(() =>
      useExerciseOverview(toExerciseId('no-such-exercise')),
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.data).toBeNull();
  });
});
