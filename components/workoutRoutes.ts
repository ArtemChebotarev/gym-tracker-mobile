// Navigation target for the workout screen (08.7 · Тренировка, task 091) — opened by the Today tab
// (099) and by the mesocycle overview's cells (095). Callers build the href here so the path and
// its `[sessionId]` param live in one place, same as components/historyRoutes.ts.

import type { Href } from 'expo-router';

/** The workout screen on session `sessionId` — `app/workout/[sessionId].tsx`. */
export function workoutHref(sessionId: string): Href {
  return { pathname: '/workout/[sessionId]', params: { sessionId } };
}
