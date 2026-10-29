// Mesocycle summary — the Summary block of the mesocycle detail screen: three tiles and the weekly
// sets card (08.9 · Мезоцикл (деталь), "Сводка"; 06 · History & Analytics, "Сводка по неделям").
// Types only; the aggregation that fills them lives in `domain/mesoSummaryBuilders.ts`. The grid
// the same screen draws is `domain/mesoGrid.ts`.
//
// There is no tonnage: a number for the sake of a number (Artem's call, 25.09.2026).

import type { ExerciseType, MuscleGroup } from './catalog';
import type { RoundLog, Session, SetLog } from './execution';

/**
 * A session of the mesocycle and every set and round logged in it. The aggregation's raw input:
 * the use case layer reads the sessions and their logs, and the domain counts.
 */
export type MesoSessionLog = {
  session: Session;
  setLogs: readonly SetLog[];
  /** The rounds of its interval and mobility exercises (10.1 FR-7). */
  roundLogs: readonly RoundLog[];
};

/** A tile's `value / total`. `total` is absent where the tile shows no denominator. */
export type MesoSummaryCount = {
  value: number;
  total?: number;
};

/** One row of the weekly sets card: a muscle group across the block's weeks. */
export type MesoWeeklySetsRow = {
  muscleGroup: MuscleGroup;
  /** One per week, `W1…Wn` — index 0 is week 1. `0` is a week with no set of this group. */
  sets: number[];
};

/** The types that get a table of their own beside the strength one (GT-113). */
export type MesoHybridType = Exclude<ExerciseType, 'strength'>;

/** One row of a type's table: an exercise across the block's weeks. */
export type MesoWeeklyExerciseRow = {
  exerciseId: string;
  name: string;
  /** For the row's dot, when the exercise has a group of its own. */
  muscleGroup: MuscleGroup;
  /**
   * One per week, index 0 is week 1: what the type logs — a power exercise's sets, an interval's
   * rounds, a mobility block's times done. `0` is a week without it.
   */
  counts: number[];
};

/**
 * A type's table (GT-113, Artem, 27.10.2026): the exercises of one hybrid type, by week. Hybrid
 * exercises have no one group to sum under, and there are few of them in a block, so the row is
 * the exercise itself.
 */
export type MesoHybridTable = {
  type: MesoHybridType;
  /** Alphabetical. Only the exercises logged in the block at least once. */
  rows: MesoWeeklyExerciseRow[];
};

export type MesoSummary = {
  /**
   * `Workouts`: `completed` sessions (a skipped one doesn't count) out of `lengthWeeks ×
   * daysPerWeek`. A stopped (`abandoned`) block has no denominator — the weeks after the Stop were
   * never in the user's plan.
   */
  workouts: MesoSummaryCount;
  /**
   * `Sets`: every `SetLog` of a `strength` exercise in the block. A power set is a set too, but not
   * hypertrophy volume: it is counted in the Power table, never here (GT-113). This count must
   * never pass for the block's whole training volume.
   */
  strengthSets: number;
  /**
   * `Weeks`: the week the block is on, by workouts — the subtitle's `Week N` (08.3's rule), the
   * week a stopped block stopped in, every week of a finished one — out of `lengthWeeks`, always
   * with its denominator. A finished block reads `7 / 7` on purpose: seeing the whole block done is
   * the motivation to get there (Artem's call, 26.09.2026).
   */
  weeks: Required<MesoSummaryCount>;
  /**
   * The Strength card: sets of `strength` exercises per muscle group, only the groups with at least
   * one set in the block, in the catalog's order. Empty for a block without a strength set.
   */
  weeklySets: MesoWeeklySetsRow[];
  /** Power, Timed work, Mobility in that order — only the types logged in the block. */
  hybridTables: MesoHybridTable[];
};
