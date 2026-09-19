// Mesocycle overview grid — see 08.7 · Тренировка, "Лист «Обзор мезоцикла»". The rules that build
// it live in `domain/mesoGridBuilders.ts`.

/**
 * A grid cell's state (08.7, the cell-state table):
 * - `completed` / `in_progress` / `skipped` — the session's own status.
 * - `ready` — a `planned` session that's programmed and can be started.
 * - `awaiting` — an `awaiting_source` session, or none yet: the day isn't programmed.
 */
export type MesoGridCellStatus = 'completed' | 'in_progress' | 'ready' | 'skipped' | 'awaiting';

export type MesoGridCell = {
  weekNumber: number;
  dayNumber: number;
  status: MesoGridCellStatus;
  /** The cell's session, when it exists. */
  sessionId?: string;
};

export type MesoGridWeek = {
  weekNumber: number;
  /** The block's last week — its row is labelled `Deload`. */
  isDeload: boolean;
  /** One per day, `dayNumber` 1..daysPerWeek. */
  cells: MesoGridCell[];
};

/** The week × day grid of a mesocycle, with what the sheet's title and subtitle need. */
export type MesoGrid = {
  mesoId: string;
  name: string;
  lengthWeeks: number;
  daysPerWeek: number;
  /** The `N` of `Week N of M`. */
  currentWeekNumber: number;
  /** One per week, `weekNumber` 1..lengthWeeks. */
  weeks: MesoGridWeek[];
};
