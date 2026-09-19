// Reads the workout screen model (08.7 · Тренировка, task 088) through the usecase layer via
// TanStack Query. Storage is the source of truth for the session (05 · Workout Execution &
// Logging, "Сохранение данных"): nothing about it lives in Zustand, and every workout mutation
// (044–049, 086) writes to storage and then invalidates `WORKOUT_SESSION_QUERY_KEY`, which covers
// both hooks below.

import { type QueryClient, useQuery } from '@tanstack/react-query';

import type { WorkoutSlot } from '@domain/workoutView';
import { getTodayWorkout, type TodayWorkout } from '@usecases/todayWorkout';
import { getWorkoutSession, getWorkoutSlot } from '@usecases/workoutSession';

import { ensureExerciseCatalogSeeded } from './exerciseLibraryStore';
import { ensureMesocyclesSeeded } from './mesocycleStore';
import { MESO_GRID_QUERY_KEY } from './useMesoGrid';
import { ensureWorkoutMocksSeeded, todayWorkoutDeps, workoutSessionDeps } from './workoutStore';

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
 * What the Today tab shows (08.7, "Навигация"): session `sessionId` when a day was picked (the
 * mesocycle overview 095, `Next workout`), otherwise the current one — the session in progress,
 * else the next day of the active mesocycle (`getTodayWorkout`, 099) — or why there's none.
 * Seeds the stub workout (domain/workoutMocks.ts) first: until Start (042) creates real sessions,
 * its in-progress Week 2 Day 1 is what the pick lands on.
 */
export function useTodayWorkout(sessionId?: string) {
  return useQuery({
    queryKey: [...WORKOUT_SESSION_QUERY_KEY, 'today', sessionId ?? 'current'],
    // Pinning the current session to its id (Finish, see app/(tabs)/index.tsx) keeps showing it
    // while its own query loads, instead of flashing the loading state.
    placeholderData: (previous) =>
      previous?.kind === 'session' && previous.model.sessionId === sessionId ? previous : undefined,
    queryFn: async (): Promise<TodayWorkout> => {
      await ensureWorkoutMocksSeeded();
      if (sessionId === undefined) {
        return getTodayWorkout(todayWorkoutDeps);
      }
      return { kind: 'session', model: await getWorkoutSession(sessionId, workoutSessionDeps) };
    },
  });
}
