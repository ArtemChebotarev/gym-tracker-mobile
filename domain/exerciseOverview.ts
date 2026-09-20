// The Overview tab of the Exercise screen, as a model — see 08.6 · Библиотека упражнений,
// "Exercise — вкладка Overview". Types only; the aggregation that fills them lives in
// domain/exerciseOverviewBuilders.ts, per the single-responsibility rule in AGENTS.md.
//
// The aggregates are computed here rather than in the storage layer on purpose (06 · History &
// Analytics: "Агрегаты считаются в доменном слое поверх сырых данных, а не в хранилище") — a move
// to a backend then moves the queries, not this logic.

import type { Exercise } from './catalog';
import type { Session, SetLog } from './execution';

/**
 * One performance of an exercise: a session and the sets logged for that exercise in it. It's the
 * raw material every aggregate below is folded out of, so it's defined here rather than in the
 * repository that reads it — `repositories/exerciseHistory.ts` reuses this type, since the domain
 * can't depend on a repository but a repository can depend on the domain.
 *
 * One session can hold two performances of the same exercise (it was added twice), so a session
 * is not a key here.
 */
export type ExercisePerformance = {
  session: Session;
  /** The sets logged in that session for this exercise, sorted by `setNumber`. */
  setLogs: SetLog[];
};

/** The `Best set` tile's set — the heaviest one ever logged (08.6, "Определение плиток"). */
export type ExerciseBestSet = {
  weight: number;
  reps: number;
};

/** The three tiles plus the two counts the History link carries. */
export type ExerciseOverviewStats = {
  bestSet: ExerciseBestSet;
  /** Distinct sessions with at least one set of this exercise. */
  sessionCount: number;
  /** `completedAt` of the most recent set — the `Last done` tile formats it. */
  lastDoneAt: string;
  /** Every set ever logged — `M sets logged all-time`. */
  setCount: number;
  /** Distinct mesocycles the exercise was performed in — `Used in N mesocycles`. */
  mesocycleCount: number;
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

/** What the `⋯` menu offers, by `Exercise.source` (08.6, "Меню и действия"). */
export type ExerciseOverviewAction = 'edit' | 'hide';

export type ExerciseOverview = {
  exercise: Exercise;
  /** `null` when the exercise has never been logged — the empty state hides the tiles (08.6). */
  stats: ExerciseOverviewStats | null;
  /** `null` when no *completed* session holds a set of it, even if some in-progress one does. */
  lastSession: ExerciseLastSession | null;
  actions: ExerciseOverviewAction[];
};
