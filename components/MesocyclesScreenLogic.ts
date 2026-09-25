// Pure helpers behind components/MesocyclesScreen.tsx — see the code-style skill and
// 08.3 · Мезоциклы — список (task 074).

import type { ActionMenuItem } from '@design/components/ActionMenu';
import { ArchiveIcon } from '@design/icons/ArchiveIcon';
import { CopyIcon } from '@design/icons/CopyIcon';
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
 * What a Planned row's `⋯` offers (08.3, task 117). Only Delete: Edit is the row's own tap, and a
 * menu that repeats what a tap already does teaches nothing. Destructive, so iOS draws it red —
 * the confirmation in front of it is the screen's, not the menu's.
 */
export function plannedMenuItems(
  mesocycle: Mesocycle,
  handlers: { onDelete: (mesocycle: Mesocycle) => void },
): ActionMenuItem[] {
  return [
    {
      key: 'delete',
      label: 'Delete',
      icon: TrashIcon,
      systemImage: 'trash',
      destructive: true,
      onPress: () => handlers.onDelete(mesocycle),
    },
  ];
}

/**
 * What the `Archive mesocycle?` confirmation says under its title. It names the block, because the
 * menu it was opened from is gone by the time the popup is on screen and a list of finished blocks
 * is a list of similar names. Then the two halves of what archiving is: the block goes, the
 * training stays — and, for now, it doesn't come back (there is no Unarchive yet).
 */
export function formatArchiveConfirmMessage(mesocycle: Mesocycle): string {
  return `"${mesocycle.name}" leaves this list. Everything you logged in it is kept, but you won't be able to bring the block back.`;
}

/**
 * What a Completed row's `⋯` offers. Copy plans the next block from this one (Flow C); Archive
 * takes it out of the list — and out of Flow C's source dropdown — without touching anything
 * logged in it. No Delete: a finished block is history, and nothing in the app hard-deletes one.
 *
 * Archive is not marked `destructive`: iOS red means data goes, and here none does — the
 * confirmation in front of it, which is the screen's rather than the menu's (as with Delete), is
 * what says the block won't come back.
 */
export function completedMenuItems(
  mesocycle: Mesocycle,
  handlers: {
    onCopy: (mesocycle: Mesocycle) => void;
    onArchive: (mesocycle: Mesocycle) => void;
  },
): ActionMenuItem[] {
  return [
    {
      key: 'copy',
      label: 'Copy',
      icon: CopyIcon,
      systemImage: 'doc.on.doc',
      onPress: () => handlers.onCopy(mesocycle),
    },
    {
      key: 'archive',
      label: 'Archive',
      icon: ArchiveIcon,
      systemImage: 'archivebox',
      onPress: () => handlers.onArchive(mesocycle),
    },
  ];
}
