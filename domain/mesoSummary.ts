// Mesocycle summary — the Summary block of the mesocycle detail screen: three tiles and the weekly
// sets card (08.9 · Мезоцикл (деталь), "Сводка"; 06 · History & Analytics, "Сводка по неделям").
// Types only; the aggregation that fills them lives in `domain/mesoSummaryBuilders.ts`. The grid
// the same screen draws is `domain/mesoGrid.ts`.
//
// There is no tonnage: a number for the sake of a number (Artem's call, 25.09.2026).

import type { MuscleGroup } from './catalog';
import type { Session, SetLog } from './execution';

/**
 * A session of the mesocycle and every set logged in it. The aggregation's raw input: the use case
 * layer reads the sessions and their set logs, and the domain counts.
 */
export type MesoSessionLog = {
  session: Session;
  setLogs: readonly SetLog[];
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

export type MesoSummary = {
  /**
   * `Workouts`: `completed` sessions (a skipped one doesn't count) out of `lengthWeeks ×
   * daysPerWeek`. A stopped (`abandoned`) block has no denominator — the weeks after the Stop were
   * never in the user's plan.
   */
  workouts: MesoSummaryCount;
  /**
   * `Sets`: every `SetLog` of the block. Named strength sets because the model only knows strength
   * work so far; hybrid exercises will come as a type of their own with their own log (08.9,
   * "Hybrid-тренировки"), and this count must never pass for the block's whole training volume.
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
   * The weekly sets card: only the muscle groups with at least one set in the block, in the
   * catalog's order. Empty for a block without a single set — the screen shows its empty state.
   */
  weeklySets: MesoWeeklySetsRow[];
};
