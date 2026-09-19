// Navigation target for opening a given day of the workout (08.7 · Тренировка, task 091) — used by
// the mesocycle overview's cells (095). Every session opens inside the Today tab, with the tab bar,
// rather than as a separate pushed page: the tab reads `sessionId` and shows that day instead of
// the current one. Callers build the href here so the param lives in one place, same as
// components/historyRoutes.ts.

import type { Href } from 'expo-router';

/** The Today tab on session `sessionId` — `app/(tabs)/index.tsx`. */
export function workoutHref(sessionId: string): Href {
  return { pathname: '/', params: { sessionId } };
}
