// Pure helpers behind components/MesoOverviewSheet.tsx — see the code-style skill.

import type { MesoGrid, MesoGridCell, MesoGridCellStatus } from '@domain/mesoGrid';

/** The sheet's subtitle (08.7, "Лист «Обзор мезоцикла»"): `Week 6 of 7 · 4 days a week`. */
export function formatMesoOverviewSubtitle(
  grid: Pick<MesoGrid, 'currentWeekNumber' | 'lengthWeeks' | 'daysPerWeek'>,
): string {
  const days = grid.daysPerWeek === 1 ? '1 day' : `${grid.daysPerWeek} days`;
  return `Week ${grid.currentWeekNumber} of ${grid.lengthWeeks} · ${days} a week`;
}

/**
 * Whether the day is behind you — the grid's only distinction between sessions (08.7, task 107).
 * `completed` and `skipped` both count: a skipped day is as finished as a trained one, and telling
 * them apart on the grid was noise Artem didn't want. Everything still to do — `ready`,
 * `in_progress`, `awaiting` — looks the same, so the grid answers "what's done, what's left, and
 * where am I" and nothing else. A cell carries no day number: its column header already says the
 * day. The full status stays in `mesoGridCellAccessibilityLabel`, where it costs no glanceability.
 */
export function isFinishedMesoGridCell(cell: Pick<MesoGridCell, 'status'>): boolean {
  return cell.status === 'completed' || cell.status === 'skipped';
}

const STATUS_LABELS: Record<MesoGridCellStatus, string> = {
  completed: 'completed',
  in_progress: 'in progress',
  ready: 'ready',
  skipped: 'skipped',
  awaiting: 'not programmed yet',
};

/** What a screen reader says for a cell: `Week 3 Day 1, not programmed yet`. */
export function mesoGridCellAccessibilityLabel(
  cell: Pick<MesoGridCell, 'weekNumber' | 'dayNumber' | 'status'>,
): string {
  return `Week ${cell.weekNumber} Day ${cell.dayNumber}, ${STATUS_LABELS[cell.status]}`;
}

/** Whether `cell` is the day the workout screen has open — it gets the inner ring. */
export function isOpenMesoGridCell(
  cell: Pick<MesoGridCell, 'weekNumber' | 'dayNumber'>,
  openDay: { weekNumber: number; dayNumber: number } | undefined,
): boolean {
  return (
    openDay !== undefined &&
    cell.weekNumber === openDay.weekNumber &&
    cell.dayNumber === openDay.dayNumber
  );
}
