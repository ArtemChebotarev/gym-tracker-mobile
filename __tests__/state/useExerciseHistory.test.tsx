import { waitFor } from '@testing-library/react-native';

import { toExerciseId } from '@domain/catalog';
import { useExerciseHistory } from '@state/useExerciseHistory';

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

describe('useExerciseHistory', () => {
  test("groups the fixture's completed session under its mesocycle", async () => {
    const { result } = renderHookWithRepositories(() =>
      useExerciseHistory(toExerciseId('bench-press-barbell')),
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));

    const groups = result.current.data ?? [];
    expect(groups).toHaveLength(1);
    expect(groups[0]?.name).toBe('Upper/Lower');
    // The fixture's week 2 day 1 is still in progress, so only week 1 day 1 is history.
    expect(groups[0]?.sessions.map((session) => session.weekNumber)).toEqual([1]);
  });

  test('is empty for an exercise that was never performed', async () => {
    const { result } = renderHookWithRepositories(() =>
      useExerciseHistory(toExerciseId('deadlift-barbell')),
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.data).toEqual([]);
  });

  test('does not read at all until it is enabled', async () => {
    const { result } = renderHookWithRepositories(() =>
      useExerciseHistory(toExerciseId('bench-press-barbell'), { enabled: false }),
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });
});
