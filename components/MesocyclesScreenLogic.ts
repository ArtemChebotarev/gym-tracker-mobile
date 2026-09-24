// Pure helpers behind components/MesocyclesScreen.tsx — see the code-style skill and
// 08.3 · Мезоциклы — список (task 074).

import type { SwipeAction } from '@design/components/SwipeableRow';
import { CopyIcon } from '@design/icons/CopyIcon';
import { EditIcon } from '@design/icons/EditIcon';
import { HistoryIcon } from '@design/icons/HistoryIcon';
import { PlayIcon } from '@design/icons/PlayIcon';
import { TrashIcon } from '@design/icons/TrashIcon';
import type { Mesocycle } from '@domain/mesocycle';
import { finishedMesocyclesNewestFirst } from '@domain/mesocycleLifecycle';
import { parseUtcIso } from '@domain/time';
import type { ListRowBadge } from '@design/components/ListRow';
import { formatAbsoluteDate } from '@design/formatDate';

/**
 * What every button that starts a new block says (Artem's call). `Plan`, not `Create`, because
 * that is what the button does: a block saved here is `planned` and does nothing until Start
 * (04 · Meso Creation Flows, "Сохранение при подтверждении"). One constant rather than the same
 * string typed into two empty states, so the two can't drift apart.
 */
export const PLAN_MESOCYCLE_LABEL = 'Plan mesocycle';

export type MesocycleGroups = {
  active: Mesocycle | null;
  planned: Mesocycle[];
  completed: Mesocycle[];
};

/**
 * Splits mesocycles into the list's three groups (08.3: fixed order Active → Planned →
 * Completed). Planned order isn't designed (08.3: "упорядочивание не проектируем"), so it's left
 * as the repository returns it; Completed is newest-finished first.
 *
 * Completed holds both ways a block ends — `completed` and `abandoned` (task 052). 08.3 used to
 * show neither an abandoned block nor anything else about it, which was invisible while nothing
 * could produce one; once Stop mesocycle could, stopping a block made it and every set logged in
 * it disappear from the app, with no screen left to reach its history from. A stopped block is
 * still a block that happened, so it is listed with the rest and told apart by its badge
 * (`mesocycleStoppedBadge`) rather than hidden. Which blocks those are, and in what order, is
 * `finishedMesocyclesNewestFirst` in the domain — Flow C's source dropdown (124) offers the same
 * set and must not disagree with this list about it.
 */
export function groupMesocycles(mesocycles: readonly Mesocycle[]): MesocycleGroups {
  return {
    active: mesocycles.find((mesocycle) => mesocycle.status === 'active') ?? null,
    planned: mesocycles.filter((mesocycle) => mesocycle.status === 'planned'),
    completed: finishedMesocyclesNewestFirst(mesocycles),
  };
}

/**
 * The `Stopped` badge on a Completed row, for a block that was stopped rather than finished (052).
 * A block that ran its course gets none — that is what the section already means.
 */
export function mesocycleStoppedBadge(mesocycle: Mesocycle): ListRowBadge | undefined {
  return mesocycle.status === 'abandoned' ? { label: 'Stopped' } : undefined;
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

/**
 * What a Planned row reveals when swiped right to left (08.3, task 117) — the two actions that
 * used to sit in its `⋯` sheet. Delete is last, so it lands under the thumb at the very edge the
 * swipe came from, the way iOS orders a destructive action.
 */
export function plannedRowActions(
  mesocycle: Mesocycle,
  handlers: { onEdit: (mesocycle: Mesocycle) => void; onDelete: (mesocycle: Mesocycle) => void },
): SwipeAction[] {
  return [
    { key: 'edit', label: 'Edit', icon: EditIcon, onPress: () => handlers.onEdit(mesocycle) },
    {
      key: 'delete',
      label: 'Delete',
      icon: TrashIcon,
      destructive: true,
      onPress: () => handlers.onDelete(mesocycle),
    },
  ];
}

/**
 * What a Completed row reveals when swiped right to left. Only History: a finished block can't be
 * edited, and deleting one is not offered anywhere (there is no hard delete in this app).
 */
export function completedRowActions(
  mesocycle: Mesocycle,
  handlers: { onOpenHistory: (mesocycle: Mesocycle) => void },
): SwipeAction[] {
  return [
    {
      key: 'history',
      label: 'History',
      icon: HistoryIcon,
      onPress: () => handlers.onOpenHistory(mesocycle),
    },
  ];
}

/**
 * A Planned row's primary action — run by pulling the row left to right (08.3, task 117). Start is
 * what you came to this screen for, so it gets the leading pull rather than a place among the
 * secondary actions. It can't fire by accident: the pull has to be a long one, and `Start` asks
 * for confirmation after that.
 */
export function plannedLeadingAction(
  mesocycle: Mesocycle,
  handlers: { onStart: (mesocycle: Mesocycle) => void },
): SwipeAction {
  return {
    key: 'start',
    label: 'Start',
    icon: PlayIcon,
    onPress: () => handlers.onStart(mesocycle),
  };
}

/** A Completed row's primary action — the same leading pull, planning the next block from this one. */
export function completedLeadingAction(
  mesocycle: Mesocycle,
  handlers: { onCopy: (mesocycle: Mesocycle) => void },
): SwipeAction {
  return {
    key: 'copy',
    label: 'Copy',
    icon: CopyIcon,
    onPress: () => handlers.onCopy(mesocycle),
  };
}
