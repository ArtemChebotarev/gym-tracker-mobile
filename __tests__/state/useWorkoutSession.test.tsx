import { act, waitFor } from '@testing-library/react-native';

import { toExerciseId } from '@domain/catalog';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { RepositorySet } from '@repositories/repositorySet';
import {
  queryClient,
  renderHookWithRepositories,
  withRepositories,
} from '../fixtures/renderWithRepositories';
import {
  useWorkoutSession,
  useWorkoutSlot,
  WORKOUT_SESSION_QUERY_KEY,
} from '@state/useWorkoutSession';
import { logSet } from '@usecases/setLogging';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const repositories = withRepositories();

// One active mesocycle with a single planned day of two set rows — the smallest thing these two
// hooks can be read against.
async function seedHookSession(store: RepositorySet): Promise<void> {
  await store.mesocycleRepo.create({
    id: 'hook-meso',
    name: 'Hook meso',
    lengthWeeks: 4,
    daysPerWeek: 1,
    startDate: '2026-09-01T08:00:00.000Z',
    status: 'active',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
  });
  await store.exerciseRepo.createCustom({
    id: toExerciseId('hook-exercise'),
    name: 'Hook press',
    muscleGroup: 'chest',
    source: 'custom',
    isHidden: false,
  });
  const { repos } = store.workoutStore;
  await repos.sessionRepo.create({
    id: 'hook-session',
    mesoId: 'hook-meso',
    weekNumber: 1,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'planned',
  });
  await repos.sessionExerciseRepo.create({
    id: 'hook-session-exercise',
    sessionId: 'hook-session',
    exerciseId: 'hook-exercise',
    order: 1,
    setTargets: [{ setNumber: 1 }, { setNumber: 2 }],
    targetRir: 3,
    status: 'planned',
  });
}

beforeEach(async () => {
  await seedHookSession(repositories());
});

describe('useWorkoutSession / useWorkoutSlot', () => {
  test("reads the session model from this test's store", async () => {
    const { result } = renderHookWithRepositories(() => useWorkoutSession('hook-session'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.mode).toBe('live');
    expect(result.current.data?.header.mesocycleName).toBe('Hook meso');
    expect(result.current.data?.exercises.map((exercise) => exercise.name)).toEqual(['Hook press']);
  });

  test('invalidating the workout key after a write shows the stored state', async () => {
    const { result } = renderHookWithRepositories(() => useWorkoutSession('hook-session'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.progress).toBe(0);

    await logSet(
      { sessionId: 'hook-session', sessionExerciseId: 'hook-session-exercise', setNumber: 1 },
      { weight: 40, reps: 10 },
      repositories().workoutStore,
    );
    await act(() => queryClient().invalidateQueries({ queryKey: WORKOUT_SESSION_QUERY_KEY }));

    await waitFor(() => expect(result.current.data?.progress).toBe(0.5));
    expect(result.current.data?.exercises[0]?.rows[0]?.log).toEqual({ weight: 40, reps: 10 });
  });

  test('previews a day whose session does not exist yet', async () => {
    const { result } = renderHookWithRepositories(() =>
      useWorkoutSlot({ mesoId: 'hook-meso', weekNumber: 2, dayNumber: 1 }),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.mode).toBe('preview');
    expect(result.current.data?.unlocksAfter).toEqual({ weekNumber: 1, dayNumber: 1 });
  });
});
