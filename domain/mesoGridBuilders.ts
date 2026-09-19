// Building the mesocycle overview grid — see 08.7 · Тренировка, "Лист «Обзор мезоцикла»". Sessions
// are generated lazily, one day at a time (03 · Progression Engine, "Ленивая генерация по дням"), so
// most future cells have no session yet and show as `awaiting`. Pure: the use case layer reads the
// mesocycle and its sessions.

import type { Session } from '@domain/execution';
import type { Mesocycle } from '@domain/mesocycle';
import type { MesoGrid, MesoGridCellStatus } from '@domain/mesoGrid';
import { isDeloadWeek } from '@domain/progressionPlan';

/** The state of a cell whose session is `session` — or which has none yet. */
export function mesoGridCellStatus(
  session: Pick<Session, 'status' | 'prescriptionStatus'> | undefined,
): MesoGridCellStatus {
  if (session === undefined) {
    return 'awaiting';
  }
  if (session.status === 'planned') {
    return session.prescriptionStatus === 'ready' ? 'ready' : 'awaiting';
  }
  return session.status;
}

function byWeekThenDay(a: Session, b: Session): number {
  return a.weekNumber - b.weekNumber || a.dayNumber - b.dayNumber;
}

/**
 * The session to train now — the one the Today tab opens (08.7, "Навигация") and `Next workout`
 * leads to: the one `in_progress`, otherwise the earliest `ready` one. `undefined` once nothing is
 * left to do (or before anything is programmed).
 */
export function currentSession<S extends Session>(sessions: readonly S[]): S | undefined {
  const inProgress = sessions.find((session) => session.status === 'in_progress');
  if (inProgress) {
    return inProgress;
  }
  const [nextReady] = sessions
    .filter((session) => mesoGridCellStatus(session) === 'ready')
    .sort(byWeekThenDay);
  return nextReady;
}

/**
 * The week the mesocycle is on — the week of `currentSession`, so it moves with the workouts done,
 * not with the calendar. Once nothing is left to do, the latest week that has a session; week 1
 * before the mesocycle has any.
 */
export function currentWeekNumber(sessions: readonly Session[]): number {
  return (
    currentSession(sessions)?.weekNumber ??
    Math.max(1, ...sessions.map((session) => session.weekNumber))
  );
}

/**
 * The `lengthWeeks` × `daysPerWeek` grid of `mesocycle`, from its `sessions` (any order; sessions of
 * other mesocycles or outside the grid are ignored).
 */
export function buildMesoGrid(mesocycle: Mesocycle, sessions: readonly Session[]): MesoGrid {
  const own = sessions.filter((session) => session.mesoId === mesocycle.id);
  const bySlot = new Map(
    own.map((session) => [`${session.weekNumber}:${session.dayNumber}`, session]),
  );

  const weeks = Array.from({ length: mesocycle.lengthWeeks }, (_, weekIndex) => {
    const weekNumber = weekIndex + 1;
    return {
      weekNumber,
      isDeload: isDeloadWeek(mesocycle.lengthWeeks, weekNumber),
      cells: Array.from({ length: mesocycle.daysPerWeek }, (_, dayIndex) => {
        const dayNumber = dayIndex + 1;
        const session = bySlot.get(`${weekNumber}:${dayNumber}`);
        const status = mesoGridCellStatus(session);
        return session
          ? { weekNumber, dayNumber, status, sessionId: session.id }
          : { weekNumber, dayNumber, status };
      }),
    };
  });

  return {
    mesoId: mesocycle.id,
    name: mesocycle.name,
    lengthWeeks: mesocycle.lengthWeeks,
    daysPerWeek: mesocycle.daysPerWeek,
    currentWeekNumber: currentWeekNumber(own),
    weeks,
  };
}
