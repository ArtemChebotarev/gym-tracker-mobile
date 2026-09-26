// Navigation targets for the screens the workout screen and the library link to: an exercise's own
// screen ("Exercise", 08.6 · Библиотека упражнений) and "Мезоцикл (деталь)" (08 · Screens &
// Navigation, 06 · History & Analytics; 08.9, task 129). Callers build their
// hrefs here so each path and its `[id]` param live in one place, not spelled out at every call
// site.

import type { Href } from 'expo-router';

/**
 * The Exercise screen for `exerciseId` — `app/exercise/[id]/index.tsx`.
 *
 * It opens on Overview wherever it's entered from, and its History tab is reachable only through
 * the switcher on the screen itself (08.6: "Прямого перехода в History с других экранов нет,
 * включая экран тренировки") — so the workout card's history button comes here too, where the
 * last-session block is what it was really after.
 */
export function exerciseDetailHref(exerciseId: string): Href {
  return { pathname: '/exercise/[id]', params: { id: exerciseId } };
}

/** "Мезоцикл (деталь)" for `mesoId` — `app/meso/[id].tsx`. */
export function mesocycleDetailHref(mesoId: string): Href {
  return { pathname: '/meso/[id]', params: { id: mesoId } };
}
