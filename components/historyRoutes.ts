// Navigation targets for the screens the workout screen and the library link to: an exercise's own
// screen ("Exercise", 08.6 · Библиотека упражнений) and "Мезоцикл (деталь)" (08 · Screens &
// Navigation, 06 · History & Analytics; 08.9, task 129). Callers build their
// hrefs here so each path and its `[id]` param live in one place, not spelled out at every call
// site.

import type { Href } from 'expo-router';

/**
 * The Exercise screen for `exerciseId` — `app/exercise/[id]/index.tsx` — on Overview, as the
 * library opens it.
 */
export function exerciseDetailHref(exerciseId: string): Href {
  return { pathname: '/exercise/[id]', params: { id: exerciseId } };
}

/**
 * The same screen, opened on its History tab — where a workout card's history button lands, every
 * time (GT-177). Overview no longer repeats the last session (GT-195), so landing there left the
 * button showing history only when the exercise happened to need none.
 */
export function exerciseHistoryHref(exerciseId: string): Href {
  return { pathname: '/exercise/[id]', params: { id: exerciseId, tab: 'history' } };
}

/**
 * The same screen as a preview from the Add/Replace picker (GT-179): no `⋯`, and the picker's
 * confirm button at the bottom — see state/exercisePickStore.ts.
 */
export function exercisePickHref(exerciseId: string): Href {
  return { pathname: '/exercise/[id]', params: { id: exerciseId, pick: '1' } };
}

/** "Мезоцикл (деталь)" for `mesoId` — `app/meso/[id].tsx`. */
export function mesocycleDetailHref(mesoId: string): Href {
  return { pathname: '/meso/[id]', params: { id: mesoId } };
}
