// Navigation target for opening a given day of the workout (08.7 · Тренировка, task 091) — used by
// the mesocycle overview's cells (095) and `Next workout`. Every session opens inside the Today tab,
// with the tab bar, rather than as a separate pushed page: the tab reads the params below and shows
// that day instead of the current one. A cell with a session opens it by `sessionId`; one without
// (not programmed yet — 03, "Ленивая генерация по дням") is addressed by mesocycle, week and day and
// opens as a preview. Callers build the href here and the tab parses it here, so the params live in
// one place, same as components/historyRoutes.ts.

import type { Href } from 'expo-router';

import type { MesoGridCell } from '@domain/mesoGrid';
import type { WorkoutPick, WorkoutSlot } from '@domain/workoutView';

/** The Today tab's params, as `useLocalSearchParams` hands them over. */
export type WorkoutRouteParams = {
  sessionId?: string;
  mesoId?: string;
  week?: string;
  day?: string;
};

/** The Today tab on session `sessionId` — `app/(tabs)/index.tsx`. */
export function workoutHref(sessionId: string): Href {
  return { pathname: '/', params: { sessionId } };
}

/** The Today tab on the day at `slot`, whose session may not exist yet. */
export function workoutSlotHref(slot: WorkoutSlot): Href {
  return {
    pathname: '/',
    params: { mesoId: slot.mesoId, week: String(slot.weekNumber), day: String(slot.dayNumber) },
  };
}

/** Where a cell of mesocycle `mesoId`'s overview grid leads: its session, else its slot. */
export function mesoGridCellHref(mesoId: string, cell: MesoGridCell): Href {
  return cell.sessionId !== undefined
    ? workoutHref(cell.sessionId)
    : workoutSlotHref({ mesoId, weekNumber: cell.weekNumber, dayNumber: cell.dayNumber });
}

function parsePositiveInt(value: string | undefined): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * The day the Today tab's params pick, if any. `sessionId` wins: pinning a slot's session to its id
 * (Finish, see app/(tabs)/index.tsx) adds it next to the slot params. Incomplete or malformed slot
 * params pick nothing, so the tab falls back to the current session.
 */
export function workoutPickFromParams(params: WorkoutRouteParams): WorkoutPick | undefined {
  if (params.sessionId !== undefined) {
    return { sessionId: params.sessionId };
  }
  const weekNumber = parsePositiveInt(params.week);
  const dayNumber = parsePositiveInt(params.day);
  if (params.mesoId === undefined || weekNumber === undefined || dayNumber === undefined) {
    return undefined;
  }
  return { slot: { mesoId: params.mesoId, weekNumber, dayNumber } };
}
