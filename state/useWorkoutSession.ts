// Reads the workout screen model (08.7 · Тренировка, task 088) through the usecase layer via
// TanStack Query. Storage is the source of truth for the session (05 · Workout Execution &
// Logging, "Сохранение данных"): nothing about it lives in Zustand, and every workout mutation
// (044–049, 086) writes to storage and then invalidates `WORKOUT_SESSION_QUERY_KEY`, which covers
// both hooks below.

import { type QueryClient, useQuery } from '@tanstack/react-query';

import type { WorkoutPick, WorkoutSlot } from '@domain/workoutView';
import { getTodayWorkout, type TodayWorkout } from '@usecases/todayWorkout';
import { getWorkoutSession, getWorkoutSlot } from '@usecases/workoutSession';

import { ensureExerciseCatalogSeeded } from './exerciseLibraryStore';
import { ensureMesocyclesSeeded } from './mesocycleStore';
import { MESO_GRID_QUERY_KEY } from './useMesoGrid';
import { todayWorkoutDeps, workoutSessionDeps } from './workoutStore';

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

/** The query key of the Today tab's pick — the current session when nothing is picked. */
function todayKey(pick: WorkoutPick | undefined): readonly unknown[] {
  if (pick === undefined) {
    return ['current'];
  }
  if ('sessionId' in pick) {
    return ['session', pick.sessionId];
  }
  return ['slot', pick.slot.mesoId, pick.slot.weekNumber, pick.slot.dayNumber];
}

/**
 * What the Today tab shows (08.7, "Навигация"): the picked day when there is one — a session by id
 * (`Next workout`, a grid cell with a session) or a grid cell by week and day (095; a preview when
 * its session doesn't exist yet) — otherwise the current one — the session in progress, else the
 * next day of the active mesocycle (`getTodayWorkout`, 099) — or why there's none.
 */
export function useTodayWorkout(pick?: WorkoutPick) {
  const pinnedSessionId = pick !== undefined && 'sessionId' in pick ? pick.sessionId : undefined;
  return useQuery({
    queryKey: [...WORKOUT_SESSION_QUERY_KEY, 'today', ...todayKey(pick)],
    // The current-session pick isn't kept once the tab leaves it (pinned by Finish, `Next workout`,
    // a grid day): it's read again on the way back. A cached one would show the day it was then —
    // stale once a session has been finished since — for a moment before the refetch replaced it.
    ...(pick === undefined ? { gcTime: 0 } : {}),
    // Pinning the shown session to its id (Finish, see app/(tabs)/index.tsx) keeps showing it
    // while its own query loads, instead of flashing the loading state.
    placeholderData: (previous) =>
      pinnedSessionId !== undefined &&
      previous?.kind === 'session' &&
      previous.model.sessionId === pinnedSessionId
        ? previous
        : undefined,
    queryFn: async (): Promise<TodayWorkout> => {
      await ensureSeeded();
      if (pick === undefined) {
        return getTodayWorkout(todayWorkoutDeps);
      }
      const model =
        'sessionId' in pick
          ? await getWorkoutSession(pick.sessionId, workoutSessionDeps)
          : await getWorkoutSlot(pick.slot, workoutSessionDeps);
      return { kind: 'session', model };
    },
  });
}
