// Navigation targets for the two history screens the workout screen links to (08.7 · Тренировка):
// the exercise card's history button opens "История упражнения", the header menu's `Mesocycle
// history` opens "Мезоцикл (деталь)" (08 · Screens & Navigation, 06 · History & Analytics). Both
// routes are EmptyState stubs for now (task 098); callers build their hrefs here so the path and
// its `[id]` param live in one place, not spelled out at every call site.

import type { Href } from 'expo-router';

/** "История упражнения" for `exerciseId` — `app/exercise/[id]/history.tsx`. */
export function exerciseHistoryHref(exerciseId: string): Href {
  return { pathname: '/exercise/[id]/history', params: { id: exerciseId } };
}

/** "Мезоцикл (деталь)" for `mesoId` — `app/meso/[id].tsx`. */
export function mesocycleDetailHref(mesoId: string): Href {
  return { pathname: '/meso/[id]', params: { id: mesoId } };
}
