// The Overview tab of the Exercise screen, as a model — see 08.6 · Библиотека упражнений,
// "Exercise — вкладка Overview", and its mockup 02-exercise-detail.html. Types only; the
// aggregation that fills them lives in domain/exerciseOverviewBuilders.ts, per the
// single-responsibility rule in AGENTS.md.
//
// The aggregates are computed here rather than in the storage layer on purpose (06 · History &
// Analytics: "Агрегаты считаются в доменном слое поверх сырых данных, а не в хранилище") — a move
// to a backend then moves the queries, not this logic.

import type { Exercise } from './catalog';
import type { RoundLog, SetLog } from './execution';
import type { ExercisePerformance } from './exerciseHistory';

export type { ExercisePerformance };

/** The heaviest set of a range of sets — the `Best set` tile. */
export type ExerciseBestSet = {
  weight: number;
  reps: number;
};

/** The three tiles (08.6, "Определение плиток"). */
export type ExerciseOverviewStats = {
  /**
   * `null` for an exercise that logs rounds, not sets (interval, mobility): a best set means
   * nothing there and the tile is left out (10.1 FR-12, Artem, 27.10.2026).
   */
  bestSet: ExerciseBestSet | null;
  /** Distinct sessions with at least one set or round of this exercise. */
  sessionCount: number;
  /** `completedAt` of the most recent set or round — the `Last done` tile formats it. */
  lastDoneAt: string;
};

/** The last completed session's block (08.6, "Последняя сессия"). */
export type ExerciseLastSession = {
  weekNumber: number;
  dayNumber: number;
  /** UTC ISO timestamp of the session's completion — the block's date. */
  completedAt: string;
  /** Every set of this exercise in that session, ascending by `setNumber`. */
  setLogs: SetLog[];
  /** Every round of this exercise in that session, ascending by `roundNumber`. */
  roundLogs: RoundLog[];
};

/** What the `⋯` menu offers, by `Exercise.source` (08.6, "Меню и действия"). */
export type ExerciseOverviewAction = 'edit' | 'hide';

export type ExerciseOverview = {
  exercise: Exercise;
  /**
   * `null` when nothing of the exercise has ever been logged, set or round — the empty state hides
   * the tiles (08.6).
   */
  stats: ExerciseOverviewStats | null;
  /**
   * `null` when no *completed* session holds a set or round of it, even if some in-progress one
   * does.
   */
  lastSession: ExerciseLastSession | null;
  actions: ExerciseOverviewAction[];
};
