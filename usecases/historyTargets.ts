// Rule 6 targets for an exercise that has no source session — shared by swapping an exercise
// (047) and adding one mid-session (048). See 03 · Progression Engine, "Правило 6": finding the
// reference performance and the time bound is the use case layer's job, the engine only turns the
// result into targets (`prescribeFromHistory`, task 084).

import type { Equipment } from '@domain/catalog';
import type { Session, SetTarget } from '@domain/execution';
import type { ProgressionSettings } from '@domain/mesocycle';
import { prescribeFromHistory } from '@domain/progressionHistory';
import { daysBefore } from '@domain/time';
import type { SetLogRepository } from '@repositories/setLogRepository';

export type HistoryTargetsQuery = {
  exerciseId: string;
  /** The session the exercise is being placed into. */
  session: Pick<Session, 'mesoId' | 'isDeload'>;
  rowCount: number;
  /** The session exercise asking — never its own reference (see `findLastPerformance`). */
  sessionExerciseId?: string;
  /** The session's mesocycle settings: rep corridor and `historyLookbackDays`. */
  settings: ProgressionSettings;
  /**
   * The exercise's equipment, when its catalog entry names one. A pure `bodyweight` exercise gets
   * reps but no weight target (task 105) — the engine decides, this only carries the fact.
   */
  equipment?: Equipment;
  now: string;
};

/**
 * `rowCount` set rows (numbered from 1) for `exerciseId` placed into `session`:
 *
 * - Deload session: no targets at all — the week isn't for progression, `N RIR` is guidance
 *   enough, so no reference is looked up.
 * - Otherwise the reference is the exercise's last non-deload performance in this mesocycle, or
 *   one logged no earlier than `now − historyLookbackDays` (085). Found → reps + 1 and its weight
 *   per row; not found → no targets, the screen shows `N RIR`.
 */
export async function targetsFromHistory(
  query: HistoryTargetsQuery,
  setLogRepo: SetLogRepository,
): Promise<SetTarget[]> {
  const { exerciseId, session, rowCount, sessionExerciseId, settings, equipment, now } = query;
  if (session.isDeload) {
    return prescribeFromHistory(null, rowCount, settings, equipment);
  }
  const reference = await setLogRepo.findLastPerformance({
    exerciseId,
    mesoId: session.mesoId,
    since: daysBefore(now, settings.historyLookbackDays),
    excludeSessionExerciseId: sessionExerciseId,
  });
  // Rule 6 progresses from the reps alone; the RIR they were done at is Flow C's business (122).
  return prescribeFromHistory(reference?.setLogs ?? null, rowCount, settings, equipment);
}
