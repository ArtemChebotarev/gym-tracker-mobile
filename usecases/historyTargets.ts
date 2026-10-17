// Rule 6 targets for an exercise that has no source session — shared by swapping an exercise
// (047) and adding one mid-session (048). See 03 · Progression Engine, "Правило 6": reading the
// history window is the use case layer's job; which performance to build on is the reference
// resolver's (`resolveReference`, task 134.1), and the targets are the exercise type's policy's (`prescribeFromReference`).

import type { Equipment, ExerciseType } from '@domain/catalog';
import type { Session, SetTarget } from '@domain/execution';
import type { ProgressionSettings } from '@domain/mesocycle';
import { policyFor } from '@domain/progressionPolicies';
import { resolveReference } from '@domain/progressionReference';
import { daysBefore } from '@domain/time';
import type { SetLogRepository } from '@repositories/setLogRepository';

export type HistoryTargetsQuery = {
  exerciseId: string;
  /** The session the exercise is being placed into. */
  session: Pick<Session, 'mesoId' | 'weekNumber' | 'dayNumber' | 'isDeload'>;
  rowCount: number;
  /**
   * The target RIR of the session's week (rule 4) — an estimate from another block is re-priced
   * to it, as Flow C does (task 134.1).
   */
  weekRir: number;
  /** The session exercise asking — never its own reference (see `listPerformances`). */
  sessionExerciseId?: string;
  /** The session's mesocycle settings: rep corridor and `historyLookbackDays`. */
  settings: ProgressionSettings;
  /**
   * The exercise's equipment, when its catalog entry names one. A pure `bodyweight` exercise gets
   * reps but no weight target (task 105) — the engine decides, this only carries the fact.
   */
  equipment?: Equipment;
  /** Picks the policy that prices the rows (`domain/progressionPolicies.ts`). Absent is `strength`. */
  type?: ExerciseType;
  now: string;
};

/**
 * `rowCount` set rows (numbered from 1) for `exerciseId` placed into `session`:
 *
 * - Deload session: no targets at all — the week isn't for progression, `N RIR` is guidance
 *   enough, so no reference is looked up.
 * - Otherwise the exercise's performances logged no earlier than `now − historyLookbackDays` go
 *   to the reference resolver with the session's slot: a reference in the exercise's own slot
 *   gives targets (reps + 1), one from another day or block an estimate (priced by where it came
 *   from — the type's policy), and none leaves the rows empty — the screen shows `N RIR`.
 */
export async function targetsFromHistory(
  query: HistoryTargetsQuery,
  setLogRepo: SetLogRepository,
): Promise<SetTarget[]> {
  const {
    exerciseId,
    session,
    rowCount,
    weekRir,
    sessionExerciseId,
    settings,
    equipment,
    type,
    now,
  } = query;
  if (session.isDeload) {
    return policyFor({ type }).prescribeFromReference({
      resolution: { kind: 'none' },
      rowCount,
      weekRir,
      settings,
      ...(equipment === undefined ? {} : { equipment }),
    });
  }
  const performances = await setLogRepo.listPerformances({
    exerciseId,
    since: daysBefore(now, settings.historyLookbackDays),
    excludeSessionExerciseId: sessionExerciseId,
  });
  const resolution = resolveReference(performances, {
    mesoId: session.mesoId,
    dayNumber: session.dayNumber,
    currentWeek: { mesoId: session.mesoId, weekNumber: session.weekNumber },
  });
  return policyFor({ type }).prescribeFromReference({
    resolution,
    rowCount,
    weekRir,
    settings,
    ...(equipment === undefined ? {} : { equipment }),
  });
}
