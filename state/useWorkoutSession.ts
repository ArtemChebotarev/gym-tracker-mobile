// Reads the workout screen model (08.7 · Тренировка, task 088) through the usecase layer via
// TanStack Query. Storage is the source of truth for the session (05 · Workout Execution &
// Logging, "Сохранение данных"): nothing about it lives in Zustand, and every workout mutation
// (044–049, 086) writes to storage and then invalidates `WORKOUT_SESSION_QUERY_KEY`, which covers
// both hooks below.

import { useQuery } from '@tanstack/react-query';

import type { WorkoutSlot } from '@domain/workoutView';
import { getWorkoutSession, getWorkoutSlot } from '@usecases/workoutSession';

import { ensureExerciseCatalogSeeded } from './exerciseLibraryStore';
import { ensureMesocyclesSeeded } from './mesocycleStore';
import { workoutSessionDeps } from './workoutStore';

/** Prefix of every workout-screen query — invalidate it after any change to a session. */
export const WORKOUT_SESSION_QUERY_KEY = ['workoutSession'] as const;

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
