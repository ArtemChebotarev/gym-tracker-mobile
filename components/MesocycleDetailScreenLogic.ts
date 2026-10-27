// Pure helpers behind components/MesocycleDetailScreen.tsx (08.9 · Мезоцикл (деталь), task 129) —
// see the code-style skill.

import type { ActionMenuItem } from '@design/components/ActionMenu';
import type { BadgeVariant } from '@design/components/Badge';
import { formatAbsoluteDate } from '@design/formatDate';
import { ArchiveIcon } from '@design/icons/ArchiveIcon';
import { CopyIcon } from '@design/icons/CopyIcon';
import { EditIcon } from '@design/icons/EditIcon';
import { getExerciseTypeLabel } from '@design/exerciseTypeLabel';
import {
  getCategoryColor,
  getCategoryVolumeFill,
  getMuscleGroupCategory,
  getNeutralVolumeFill,
} from '@design/muscleGroupColor';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';
import type { Mesocycle } from '@domain/mesocycle';
import type { MuscleGroup } from '@domain/catalog';
import type {
  MesoSummary,
  MesoSummaryCount,
  MesoWeeklyExerciseRow,
  MesoWeeklySetsRow,
} from '@domain/mesoSummary';
import { FINAL_MESOCYCLE_STATUSES } from '@domain/mesocycleLifecycle';

/**
 * The badge beside the title (08.9, "Шапка"): `Active` in accent, `Stopped` neutral, and none for a
 * block that ran to its end.
 */
export function mesocycleDetailBadge(
  status: Mesocycle['status'],
): { label: string; variant: BadgeVariant } | undefined {
  if (status === 'active') {
    return { label: 'Active', variant: 'accent' };
  }
  if (status === 'abandoned') {
    return { label: 'Stopped', variant: 'neutral' };
  }
  return undefined;
}

function formatIsoDate(iso: string): string {
  return formatAbsoluteDate(new Date(iso));
}

/** `3 Aug – 20 Sep`, or just the start while the block has no end yet. */
function formatSpan(mesocycle: Pick<Mesocycle, 'startDate' | 'completedAt'>): string | undefined {
  if (mesocycle.startDate === undefined) {
    return undefined;
  }
  const start = formatIsoDate(mesocycle.startDate);
  return mesocycle.completedAt === undefined
    ? start
    : `${start} – ${formatIsoDate(mesocycle.completedAt)}`;
}

/**
 * The line under the title (08.9, "Шапка"):
 * - Completed: `7 weeks · 3 Aug – 20 Sep`
 * - Stopped: `Stopped in week 4 · 3 Aug – 27 Aug`
 * - Active: `Week 4 of 7 · started 3 Aug`
 *
 * `weekNumber` is the block's week by workouts, not the calendar (08.3's rule) — for a stopped
 * block, the last week it reached.
 */
export function formatMesocycleDetailSubtitle(
  mesocycle: Pick<Mesocycle, 'status' | 'lengthWeeks' | 'startDate' | 'completedAt'>,
  weekNumber: number,
): string {
  const span = formatSpan(mesocycle);
  const parts: string[] = [];
  switch (mesocycle.status) {
    case 'active':
      parts.push(`Week ${weekNumber} of ${mesocycle.lengthWeeks}`);
      if (mesocycle.startDate !== undefined) {
        parts.push(`started ${formatIsoDate(mesocycle.startDate)}`);
      }
      break;
    case 'abandoned':
      parts.push(`Stopped in week ${weekNumber}`);
      if (span !== undefined) {
        parts.push(span);
      }
      break;
    default:
      parts.push(`${mesocycle.lengthWeeks} weeks`);
      if (span !== undefined) {
        parts.push(span);
      }
  }
  return parts.join(' · ');
}

/** A tile's `value` and optional `total`, as StatTile takes them. */
export function formatSummaryCount(count: MesoSummaryCount): { value: string; total?: string } {
  return count.total === undefined
    ? { value: String(count.value) }
    : { value: String(count.value), total: String(count.total) };
}

/** `W1…Wn` — the weekly sets card's column headers. */
export function weekColumnLabels(lengthWeeks: number): string[] {
  return Array.from({ length: lengthWeeks }, (_, index) => `W${index + 1}`);
}

export type WeeklyTableCell = {
  weekNumber: number;
  /** `–` for an empty week — drawn as a dashed, empty cell. */
  label: string;
  /** The cell's fill; absent on an empty week. */
  fill?: string;
};

/** One row of a weekly table as drawn — a muscle group on the Strength card, an exercise on the others. */
export type WeeklyTableRowView = {
  key: string;
  label: string;
  dotColor?: string;
  cells: WeeklyTableCell[];
};

/** One card of the summary: Strength, then a card per hybrid type logged in the block (GT-113). */
export type WeeklyTableView = {
  key: string;
  /** The card's label — the type's own name. */
  title: string;
  rows: WeeklyTableRowView[];
};

/**
 * The weekly sets card as it's drawn (08.9, "Недельный объём"): each group with its label and dot,
 * each week with its count on the group's category color — the more sets, the more saturated,
 * scaled to the card's largest cell so the strongest week reads strongest.
 */
export function weeklySetsRowViews(rows: readonly MesoWeeklySetsRow[]): WeeklyTableRowView[] {
  const most = Math.max(1, ...rows.flatMap((row) => row.sets));
  return rows.map((row) => ({
    key: row.muscleGroup,
    label: getMuscleGroupLabel(row.muscleGroup),
    ...groupColors(row.muscleGroup, row.sets, most),
  }));
}

/**
 * A hybrid type's card as it's drawn (GT-113): each exercise by name, each week with what the
 * type logs. An exercise with a group of its own keeps that group's dot and color; one without
 * (`fullBody`) is drawn in the neutral fill, scaled the same way.
 */
export function weeklyExerciseRowViews(
  rows: readonly MesoWeeklyExerciseRow[],
): WeeklyTableRowView[] {
  const most = Math.max(1, ...rows.flatMap((row) => row.counts));
  return rows.map((row) => ({
    key: row.exerciseId,
    label: row.name,
    ...groupColors(row.muscleGroup, row.counts, most),
  }));
}

/**
 * The cards of the summary, in order: Strength — with an empty-state line when the block has no
 * strength set and nothing else either — then Power, Timed work, Mobility for the types logged.
 * A block of hybrid work only has no Strength card at all.
 */
export function weeklyTableViews(summary: MesoSummary): WeeklyTableView[] {
  const strength: WeeklyTableView[] =
    summary.weeklySets.length > 0 || summary.hybridTables.length === 0
      ? [
          {
            key: 'strength',
            title: getExerciseTypeLabel('strength'),
            rows: weeklySetsRowViews(summary.weeklySets),
          },
        ]
      : [];
  return [
    ...strength,
    ...summary.hybridTables.map((table) => ({
      key: table.type,
      title: getExerciseTypeLabel(table.type),
      rows: weeklyExerciseRowViews(table.rows),
    })),
  ];
}

function groupColors(
  muscleGroup: MuscleGroup,
  counts: readonly number[],
  most: number,
): Pick<WeeklyTableRowView, 'dotColor' | 'cells'> {
  const category = getMuscleGroupCategory(muscleGroup);
  return {
    dotColor: category ? getCategoryColor(category) : undefined,
    cells: counts.map((count, index) => {
      const weekNumber = index + 1;
      if (count === 0) {
        return { weekNumber, label: '–' };
      }
      const share = count / most;
      return {
        weekNumber,
        label: String(count),
        fill: category ? getCategoryVolumeFill(category, share) : getNeutralVolumeFill(share),
      };
    }),
  };
}

/**
 * Whether the screen draws the workout grid (08.9, "Идея"): only for a closed block — `completed`
 * or `abandoned`. An active block's grid is a button away on its workout screen already.
 */
export function showsWorkoutGrid(status: Mesocycle['status']): boolean {
  return FINAL_MESOCYCLE_STATUSES.includes(status);
}

/**
 * What the header's `⋯` offers (08.9, "Шапка"): Rename always; Copy and Archive only for a closed
 * block — the same two a Completed row's `⋯` holds on 08.3, in the same order and with the same
 * icons. Stop isn't here; it stays in the workout's menu. Archive isn't `destructive`, for the
 * reason `completedMenuItems` gives: nothing logged goes, and the confirmation says the rest.
 */
export function mesocycleDetailMenuItems(
  status: Mesocycle['status'],
  handlers: { onRename: () => void; onCopy: () => void; onArchive: () => void },
): ActionMenuItem[] {
  const items: ActionMenuItem[] = [
    {
      key: 'rename',
      label: 'Rename cycle',
      icon: EditIcon,
      systemImage: 'pencil',
      onPress: handlers.onRename,
    },
  ];
  if (showsWorkoutGrid(status)) {
    items.push({
      key: 'copy',
      label: 'Copy',
      icon: CopyIcon,
      systemImage: 'doc.on.doc',
      onPress: handlers.onCopy,
    });
    items.push({
      key: 'archive',
      label: 'Archive',
      icon: ArchiveIcon,
      systemImage: 'archivebox',
      onPress: handlers.onArchive,
    });
  }
  return items;
}
