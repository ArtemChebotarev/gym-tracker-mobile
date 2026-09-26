// Pure helpers behind components/MesocycleDetailScreen.tsx (08.9 · Мезоцикл (деталь), task 129) —
// see the code-style skill.

import type { ActionMenuItem } from '@design/components/ActionMenu';
import type { BadgeVariant } from '@design/components/Badge';
import { formatAbsoluteDate } from '@design/formatDate';
import { CopyIcon } from '@design/icons/CopyIcon';
import { EditIcon } from '@design/icons/EditIcon';
import {
  getCategoryColor,
  getCategoryVolumeFill,
  getMuscleGroupCategory,
} from '@design/muscleGroupColor';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';
import type { Mesocycle } from '@domain/mesocycle';
import type { MesoSummaryCount, MesoWeeklySetsRow } from '@domain/mesoSummary';
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

export type WeeklySetsCell = {
  weekNumber: number;
  /** `–` for a week with no set of this group — drawn as a dashed, empty cell. */
  label: string;
  /** The cell's fill; absent on an empty week. */
  fill?: string;
};

export type WeeklySetsRowView = {
  muscleGroup: MesoWeeklySetsRow['muscleGroup'];
  label: string;
  dotColor?: string;
  cells: WeeklySetsCell[];
};

/**
 * The weekly sets card as it's drawn (08.9, "Недельный объём"): each group with its label and dot,
 * each week with its count on the group's category color — the more sets, the more saturated,
 * scaled to the card's largest cell so the strongest week reads strongest.
 */
export function weeklySetsRowViews(rows: readonly MesoWeeklySetsRow[]): WeeklySetsRowView[] {
  const most = Math.max(1, ...rows.flatMap((row) => row.sets));
  return rows.map((row) => {
    const category = getMuscleGroupCategory(row.muscleGroup);
    return {
      muscleGroup: row.muscleGroup,
      label: getMuscleGroupLabel(row.muscleGroup),
      dotColor: category ? getCategoryColor(category) : undefined,
      cells: row.sets.map((sets, index) =>
        sets === 0 || category === undefined
          ? { weekNumber: index + 1, label: sets === 0 ? '–' : String(sets) }
          : {
              weekNumber: index + 1,
              label: String(sets),
              fill: getCategoryVolumeFill(category, sets / most),
            },
      ),
    };
  });
}

/**
 * What the header's `⋯` offers (08.9, "Шапка"): Rename always, Copy only for a closed block — the
 * same way into Flow C as 08.3's Completed row. Stop isn't here; it stays in the workout's menu.
 */
export function mesocycleDetailMenuItems(
  status: Mesocycle['status'],
  handlers: { onRename: () => void; onCopy: () => void },
): ActionMenuItem[] {
  const items: ActionMenuItem[] = [
    {
      key: 'rename',
      label: 'Rename mesocycle',
      icon: EditIcon,
      systemImage: 'pencil',
      onPress: handlers.onRename,
    },
  ];
  if (FINAL_MESOCYCLE_STATUSES.includes(status)) {
    items.push({
      key: 'copy',
      label: 'Copy',
      icon: CopyIcon,
      systemImage: 'doc.on.doc',
      onPress: handlers.onCopy,
    });
  }
  return items;
}
