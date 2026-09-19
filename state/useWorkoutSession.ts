// Reads the workout screen model (08.7 · Тренировка, task 088) through the usecase layer via
// TanStack Query. Storage is the source of truth for the session (05 · Workout Execution &
// Logging, "Сохранение данных"): nothing about it lives in Zustand, and every workout mutation
// (044–049, 086) writes to storage and then invalidates `WORKOUT_SESSION_QUERY_KEY`, which covers
// both hooks below.

import { type QueryClient, useQuery } from '@tanstack/react-query';

import type { WorkoutSlot } from '@domain/workoutView';
import { MOCK_SESSION_IDS } from '@domain/workoutMocks';
import { getWorkoutSession, getWorkoutSlot } from '@usecases/workoutSession';

import { ensureExerciseCatalogSeeded } from './exerciseLibraryStore';
import { ensureMesocyclesSeeded } from './mesocycleStore';
import { MESO_GRID_QUERY_KEY } from './useMesoGrid';
import { ensureWorkoutMocksSeeded, workoutSessionDeps } from './workoutStore';

/** Prefix of every workout-screen query — invalidate it after any change to a session. */
export const WORKOUT_SESSION_QUERY_KEY = ['workoutSession'] as const;

/**
 * Invalidates what a workout mutation can change: the workout screen, and the mesocycle grid —
 * whose current week the Mesocycles tab's Active card shows — since starting or finishing a
 * session can move it.
 */
export function invalidateWorkoutQueries(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: WORKOUT_SESSION_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: MESO_GRID_QUERY_KEY }),
  ]);
}

async function ensureSeeded(): Promise<void> {
  await Promise.all([ensureExerciseCatalogSeeded(), ensureMesocyclesSeeded()]);
}

/** Session `sessionId` — live, read-only, or preview for an `awaiting_source` one. */
export function useWorkoutSession(sessionId: string) {
  return useQuery({
    queryKey: [...WORKOUT_SESSION_QUERY_KEY, 'session', sessionId],
    queryFn: async () => {
      await ensureSeeded();
      return getWorkoutSession(sessionId, workoutSessionDeps);
    },
  });
}

/**
 * The day at `slot` of the mesocycle overview grid, whose session may not exist yet — then it's a
 * preview of the day's latest programmed composition.
 */
export function useWorkoutSlot(slot: WorkoutSlot) {
  return useQuery({
    queryKey: [...WORKOUT_SESSION_QUERY_KEY, 'slot', slot.mesoId, slot.weekNumber, slot.dayNumber],
    queryFn: async () => {
      await ensureSeeded();
      return getWorkoutSlot(slot, workoutSessionDeps);
    },
  });
}

/**
 * The session the Today tab shows (08.7, "Навигация"): `sessionId` when a day was picked (the
 * mesocycle overview, 095), otherwise the current session. Temporary: Start (042) doesn't exist
 * yet, so there are no real sessions — this seeds the stub workout (domain/workoutMocks.ts) and its
 * in-progress session stands in for the current one. Task 099 replaces that with the real pick:
 * the `in_progress` session, otherwise the next `ready` one of the active mesocycle.
 */
export function useTodayWorkoutSession(sessionId?: string) {
  return useQuery({
    queryKey: [...WORKOUT_SESSION_QUERY_KEY, 'today', sessionId ?? 'current'],
    queryFn: async () => {
      await ensureWorkoutMocksSeeded();
      return getWorkoutSession(sessionId ?? MOCK_SESSION_IDS.live, workoutSessionDeps);
    },
  });
}
