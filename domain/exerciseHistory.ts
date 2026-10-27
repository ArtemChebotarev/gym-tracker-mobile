// The History tab of the Exercise screen, as a model — see 06 · History & Analytics (Сценарий 2:
// "история упражнения") and 08.6 · Библиотека упражнений (task 108). Types only; the grouping that
// fills them lives in domain/exerciseHistoryBuilders.ts, per the single-responsibility rule in
// AGENTS.md.
//
// This module owns `ExercisePerformance`, the raw shape both tabs are folded out of: the history
// is the primitive, and the Overview tab (domain/exerciseOverview.ts) is a narrowing of it, not
// the other way round.

import type { Session, SetLog } from './execution';
import type { Mesocycle } from './mesocycle';

/**
 * One performance of an exercise: a session and the sets logged for that exercise in it. It's
 * defined here rather than in the repository that reads it — `repositories/exerciseHistory.ts`
 * reuses this type, since the domain can't depend on a repository but a repository can depend on
 * the domain.
 *
 * One session can hold two performances of the same exercise (it was added twice), so a session
 * is not a key here.
 */
export type ExercisePerformance = {
  session: Session;
  /** The sets logged in that session for this exercise, sorted by `setNumber`. */
  setLogs: SetLog[];
};

/**
 * A performance with the mesocycle its session belongs to. The History tab groups by mesocycle and
 * names each group, so it needs the record itself; the Overview tab doesn't and simply ignores it.
 */
export type ExerciseHistoryPerformance = ExercisePerformance & {
  mesocycle: Mesocycle;
};

/** One session in the history list — the same shape the Overview tab's `Last session` block has. */
export type ExerciseHistorySession = {
  /**
   * Unique per row, not per session: one session can hold two performances of the same exercise,
   * and both are listed. Taken from the row's first set log, which every listed row has.
   */
  id: string;
  weekNumber: number;
  dayNumber: number;
  /** UTC ISO timestamp of the session's completion — the row's date. */
  completedAt: string;
  /** Every set of this exercise in that session, ascending by `setNumber`. */
  setLogs: SetLog[];
};

/** One section of the history list: a mesocycle and what was done in it. */
export type ExerciseHistoryMesocycle = {
  mesoId: string;
  name: string;
  /** Newest first. */
  sessions: ExerciseHistorySession[];
};

/**
 * Which way a power exercise's load went from the week before (10.1 FR-12, "смены варианта"): a
 * heavier ball, a higher box. A change of the exercise itself is a replacement and starts a history
 * of its own, so within one history the load is the variation that changes.
 */
export type PowerLoadChange = 'up' | 'down';

/** One week of a power exercise's history — its best set, the row of canvas 5.2. */
export type PowerHistoryWeek = {
  /** Unique across the whole history: a week number repeats in every mesocycle. */
  id: string;
  weekNumber: number;
  /** The week's best set across every session of it: the highest load, ties by reps. */
  bestSet: SetLog;
  /** Every set of the week reached the top of the corridor — when the card offers a heavier load. */
  isAtTopOfRange: boolean;
  /** Against the week before it, across a mesocycle boundary too; absent when the load held. */
  loadChange?: PowerLoadChange;
};

/** One section of a power exercise's history: a mesocycle and its weeks, newest first. */
export type PowerHistoryMesocycle = {
  mesoId: string;
  name: string;
  weeks: PowerHistoryWeek[];
};
