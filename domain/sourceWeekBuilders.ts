// Which weeks of a finished block Flow C may copy, and which one step S opens on — 08.8 ·
// Редактор мезоцикла — Flow C, "Шаг S — Source week", and 04 · Meso Creation Flows, "Запрет
// копирования deload-недели" / "Незавершённые недели". Pure: the use case layer reads the
// mesocycle and its sessions and hands them here.
//
// Two weeks never make the list, for two different reasons:
// - The deload week, because it is a bad starting point — artificially low volume and half the
//   weight (04). It is left out of the options entirely rather than shown disabled: the reason
//   belongs under the field once, not beside a row nobody can pick (decided 23.09.2026, 08.8).
// - A week with no sessions, because it does not exist yet. Weeks from the second on are
//   materialized day by day as the week before them finishes (03 · Progression Engine, "Ленивая
//   генерация по дням"), so a week the block never reached has nothing to copy.
//
// A week where nothing was *completed* is a different matter and is offered like any other: what
// is copied is structure, and an untrained week has just as much of it (04, decided 22.09.2026).

import type { Session } from '@domain/execution';
import type { Mesocycle } from '@domain/mesocycle';
import { isDeloadWeek } from '@domain/mesocycleWeeks';
import type { SourceWeekOption } from '@domain/sourceWeek';

/**
 * Every week of `mesocycle` that Flow C can start from, ascending by week number. `sessions` may
 * be the block's whole list in any order; sessions of other mesocycles are ignored, the same way
 * `unfinishedSessions` ignores them.
 *
 * Returns an empty array for a block whose only weeks are its deload one or which has no sessions
 * at all — nothing to copy, which the caller shows as such rather than an empty dropdown.
 */
export function buildSourceWeekOptions(
  mesocycle: Pick<Mesocycle, 'id' | 'lengthWeeks'>,
  sessions: readonly Session[],
): SourceWeekOption[] {
  const byWeek = new Map<number, SourceWeekOption>();

  for (const session of sessions) {
    if (session.mesoId !== mesocycle.id) continue;
    if (isDeloadWeek(mesocycle.lengthWeeks, session.weekNumber)) continue;

    const option = byWeek.get(session.weekNumber) ?? {
      weekNumber: session.weekNumber,
      completedCount: 0,
      sessionCount: 0,
    };
    byWeek.set(session.weekNumber, {
      weekNumber: session.weekNumber,
      // `completed` only, not every final status: a skipped workout is a workout that didn't
      // happen, and counting it would make `4 of 4 workouts` mean two different things.
      completedCount: option.completedCount + (session.status === 'completed' ? 1 : 0),
      sessionCount: option.sessionCount + 1,
    });
  }

  return [...byWeek.values()].sort((a, b) => a.weekNumber - b.weekNumber);
}

/**
 * The week step S opens on: the block's last working week that has sessions — the one the user
 * just trained, and the one they mean nine times out of ten (08.8: "по умолчанию последняя
 * рабочая (не deload) неделя"). `undefined` when `options` is empty.
 *
 * `options` is already free of deload and of weeks that don't exist, so "last working week with
 * sessions" is simply the last of them.
 */
export function defaultSourceWeekNumber(
  options: readonly SourceWeekOption[],
): number | undefined {
  return options.at(-1)?.weekNumber;
}
