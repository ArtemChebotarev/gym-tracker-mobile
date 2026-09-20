import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { toExerciseId } from '@domain/catalog';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { appStore } from '@state/appStore';
import {
  useWorkoutSession,
  useWorkoutSlot,
  WORKOUT_SESSION_QUERY_KEY,
} from '@state/useWorkoutSession';
import { InMemoryExerciseRepository } from '@storage/exerciseRepository';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';
import { logSet } from '@usecases/setLogging';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

let client: QueryClient;

beforeAll(async () => {
  await new InMemoryMesocycleRepository(appStore).create({
    id: 'hook-meso',
    name: 'Hook meso',
    lengthWeeks: 4,
    daysPerWeek: 1,
    startDate: '2026-09-01T08:00:00.000Z',
    status: 'active',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
  });
  await new InMemoryExerciseRepository(appStore).createCustom({
    id: toExerciseId('hook-exercise'),
    name: 'Hook press',
    muscleGroup: 'chest',
    source: 'custom',
    isHidden: false,
  });
  const { repos } = createInMemoryWorkoutStore(appStore);
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
});

beforeEach(() => {
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

describe('useWorkoutSession / useWorkoutSlot', () => {
  test('reads the session model from the app-wide store', async () => {
    const { result } = renderHook(() => useWorkoutSession('hook-session'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.mode).toBe('live');
    expect(result.current.data?.header.mesocycleName).toBe('Hook meso');
    expect(result.current.data?.exercises.map((exercise) => exercise.name)).toEqual(['Hook press']);
  });

  test('invalidating the workout key after a write shows the stored state', async () => {
    const { result } = renderHook(() => useWorkoutSession('hook-session'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.progress).toBe(0);

    await logSet(
      { sessionId: 'hook-session', sessionExerciseId: 'hook-session-exercise', setNumber: 1 },
      { weight: 40, reps: 10 },
      createInMemoryWorkoutStore(appStore),
    );
    await act(() => client.invalidateQueries({ queryKey: WORKOUT_SESSION_QUERY_KEY }));

    await waitFor(() => expect(result.current.data?.progress).toBe(0.5));
    expect(result.current.data?.exercises[0]?.rows[0]?.log).toEqual({ weight: 40, reps: 10 });
  });

  test('previews a day whose session does not exist yet', async () => {
    const { result } = renderHook(
      () => useWorkoutSlot({ mesoId: 'hook-meso', weekNumber: 2, dayNumber: 1 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.mode).toBe('preview');
    expect(result.current.data?.unlocksAfter).toEqual({ weekNumber: 1, dayNumber: 1 });
  });
});
