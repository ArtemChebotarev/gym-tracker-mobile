// Pure helpers behind components/MesocyclesScreen.tsx — see the code-style skill and
// 08.3 · Мезоциклы — список (task 074).

import type { Mesocycle } from '@domain/mesocycle';
import { parseUtcIso } from '@domain/time';
import { formatAbsoluteDate } from '@design/formatDate';

export type MesocycleGroups = {
  active: Mesocycle | null;
  planned: Mesocycle[];
  completed: Mesocycle[];
};

/**
 * Splits mesocycles into the list's three groups (08.3: fixed order Active → Planned →
 * Completed). `abandoned` mesocycles belong to none of them and aren't shown. Planned order isn't
 * designed (08.3: "упорядочивание не проектируем"), so it's left as the repository returns it;
 * Completed is newest-finished first.
 */
export function groupMesocycles(mesocycles: readonly Mesocycle[]): MesocycleGroups {
  return {
    active: mesocycles.find((mesocycle) => mesocycle.status === 'active') ?? null,
    planned: mesocycles.filter((mesocycle) => mesocycle.status === 'planned'),
    completed: mesocycles
      .filter((mesocycle) => mesocycle.status === 'completed')
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
  };
}

/** True when no group has anything to render — the first-launch `EmptyState` case. */
export function isEmptyGroups(groups: MesocycleGroups): boolean {
  return groups.active === null && groups.planned.length === 0 && groups.completed.length === 0;
}

export type WeekDotState = 'done' | 'current' | 'upcoming';

/** One entry per week of the block, for the Active card's progress dots. */
export function getWeekDots(lengthWeeks: number, currentWeek: number): WeekDotState[] {
  return Array.from({ length: lengthWeeks }, (_, index) => {
    const week = index + 1;
    if (week < currentWeek) return 'done';
    if (week === currentWeek) return 'current';
    return 'upcoming';
  });
}

/**
 * `Week N of M · started {date}` — `week` is the mesocycle's current week, read from its sessions
 * (see `currentWeekNumber` in domain/mesoGridBuilders.ts), not from the calendar: a few days' break
 * between workouts doesn't move the block forward.
 */
export function formatActiveCaption(mesocycle: Mesocycle, week: number): string {
  const base = `Week ${week} of ${mesocycle.lengthWeeks}`;
  if (mesocycle.startDate === undefined) {
    return base;
  }
  return `${base} · started ${formatAbsoluteDate(parseUtcIso(mesocycle.startDate))}`;
}

/** `N weeks · M days/week` */
export function formatPlannedCaption(mesocycle: Mesocycle): string {
  const days = mesocycle.daysPerWeek === 1 ? 'day' : 'days';
  return `${mesocycle.lengthWeeks} weeks · ${mesocycle.daysPerWeek} ${days}/week`;
}

/** `N weeks · {start} – {end}` */
export function formatCompletedCaption(mesocycle: Mesocycle): string {
  const base = `${mesocycle.lengthWeeks} weeks`;
  if (mesocycle.startDate === undefined || mesocycle.completedAt === undefined) {
    return base;
  }
  const start = formatAbsoluteDate(parseUtcIso(mesocycle.startDate));
  const end = formatAbsoluteDate(parseUtcIso(mesocycle.completedAt));
  return `${base} · ${start} – ${end}`;
}

/** The short summary under the `Start this mesocycle?` confirmation's title. */
export function formatStartConfirmMessage(mesocycle: Mesocycle): string {
  return `${mesocycle.name} · ${formatPlannedCaption(mesocycle)}. Week 1 starts today.`;
}

/** Why Start is unavailable while another mesocycle is active (08.3: the message is mandatory). */
export function formatStartBlockedMessage(active: Mesocycle): string {
  return `"${active.name}" is still active. Finish or abandon it before starting another mesocycle.`;
}
