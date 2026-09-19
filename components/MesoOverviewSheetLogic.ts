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
 * The text inside a cell (08.7, the cell-state table): `Now`, `D1`…`D7`, a struck-out `Skip`, or
 * `—` for a day not programmed yet. A completed cell shows a check instead — `undefined`.
 */
export function mesoGridCellText(cell: Pick<MesoGridCell, 'status' | 'dayNumber'>) {
  switch (cell.status) {
    case 'completed':
      return undefined;
    case 'in_progress':
      return 'Now';
    case 'ready':
      return `D${cell.dayNumber}`;
    case 'skipped':
      return 'Skip';
    case 'awaiting':
      return '—';
  }
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
