// The Overview tab of the Exercise screen, as a model — see 08.6 · Библиотека упражнений,
// "Exercise — вкладка Overview", and its mockup 02-exercise-detail.html. Types only; the
// aggregation that fills them lives in domain/exerciseOverviewBuilders.ts, per the
// single-responsibility rule in AGENTS.md.
//
// The aggregates are computed here rather than in the storage layer on purpose (06 · History &
// Analytics: "Агрегаты считаются в доменном слое поверх сырых данных, а не в хранилище") — a move
// to a backend then moves the queries, not this logic.

import type { Exercise } from './catalog';
import type { SetLog } from './execution';
import type { ExercisePerformance } from './exerciseHistory';

export type { ExercisePerformance };

/** The heaviest set of a range of sets — the `Best set` tile, and each earlier session's line. */
export type ExerciseBestSet = {
  weight: number;
  reps: number;
};

/** The three tiles (08.6, "Определение плиток"). */
export type ExerciseOverviewStats = {
  bestSet: ExerciseBestSet;
  /** Distinct sessions with at least one set of this exercise. */
  sessionCount: number;
  /** `completedAt` of the most recent set — the `Last done` tile formats it. */
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
};

/** One line of the `Earlier` block: a session before the last one, at a glance. */
export type ExerciseSessionSummary = {
  weekNumber: number;
  dayNumber: number;
  completedAt: string;
  /** That session's heaviest set — `80 × 8` in the mockup. */
  bestSet: ExerciseBestSet;
  setCount: number;
};

/** What the `⋯` menu offers, by `Exercise.source` (08.6, "Меню и действия"). */
export type ExerciseOverviewAction = 'edit' | 'hide';

export type ExerciseOverview = {
  exercise: Exercise;
  /** `null` when the exercise has never been logged — the empty state hides the tiles (08.6). */
  stats: ExerciseOverviewStats | null;
  /** `null` when no *completed* session holds a set of it, even if some in-progress one does. */
  lastSession: ExerciseLastSession | null;
  /** The completed sessions before `lastSession`, newest first — empty when there are none. */
  earlierSessions: ExerciseSessionSummary[];
  actions: ExerciseOverviewAction[];
};
