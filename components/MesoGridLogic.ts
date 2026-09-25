// Pure helpers behind components/MesoGrid.tsx — see the code-style skill.

import type { MesoGridCell, MesoGridCellStatus } from '@domain/mesoGrid';

/**
 * How a cell is drawn (08.7, the cell-state table). Five statuses collapse into three looks, and
 * the grid answers four questions and no more: which days are behind you, which were skipped, which
 * are left, and which one you have open.
 *
 * - `done` — `completed`, including a session with only some of its sets logged: it was trained.
 * - `skip` — `skipped`, the word `Skip` struck through. It came back as a look of its own with the
 *   green redesign (Artem's call, 25.09.2026): in the old grey grid a skipped day was
 *   indistinguishable from a trained one, so task 107 folded the two together; against `accent/bg`
 *   it tells itself apart without adding weight.
 * - `left` — `ready`, `in_progress`, `awaiting` or no session at all. Telling a programmed day from
 *   an unprogrammed one was never something the grid needed to say.
 */
export type MesoGridCellLook = 'done' | 'skip' | 'left';

export function mesoGridCellLook(cell: Pick<MesoGridCell, 'status'>): MesoGridCellLook {
  if (cell.status === 'completed') {
    return 'done';
  }
  return cell.status === 'skipped' ? 'skip' : 'left';
}

const STATUS_LABELS: Record<MesoGridCellStatus, string> = {
  completed: 'completed',
  in_progress: 'in progress',
  ready: 'ready',
  skipped: 'skipped',
  awaiting: 'not programmed yet',
};

/**
 * What a screen reader says for a cell: `Week 3 Day 1, not programmed yet`. The grid draws three
 * looks, but the full status never leaves the accessibility label — there it costs no glanceability.
 */
export function mesoGridCellAccessibilityLabel(
  cell: Pick<MesoGridCell, 'weekNumber' | 'dayNumber' | 'status'>,
): string {
  return `Week ${cell.weekNumber} Day ${cell.dayNumber}, ${STATUS_LABELS[cell.status]}`;
}

/**
 * Whether `cell` is the day the caller has open — its own outline turns `accent` at
 * `border/emphasis`. Matched by session, so a day with no session never counts as open.
 */
export function isOpenMesoGridCell(
  cell: Pick<MesoGridCell, 'sessionId'>,
  openSessionId: string | undefined,
): boolean {
  return openSessionId !== undefined && cell.sessionId === openSessionId;
}

/**
 * Whether a cell opens anything. In the overview sheet (08.7) every cell does, a day not programmed
 * yet included — it opens in preview. On the mesocycle detail screen of a stopped block (08.9) the
 * days after the Stop have no session and never will, so `dimsEmptyCells` turns them inert instead
 * of offering a tap that leads nowhere.
 */
export function isMesoGridCellPressable(
  cell: Pick<MesoGridCell, 'sessionId'>,
  dimsEmptyCells: boolean,
): boolean {
  return !dimsEmptyCells || cell.sessionId !== undefined;
}
