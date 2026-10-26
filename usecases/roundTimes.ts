// A round time picked on an interval card — GT-187 (10.1 FR-9). An interval's work and rest are its
// structure, the way a set count is, not a result: with no history the rounds start empty and the
// time is picked on the card, and it is stored as the rounds' plan right away so that it outlives
// the screen. Logging, the timer and next week then read it like any planned time. The rule that a
// typed but unlogged value isn't saved (05, "Сохранение данных") is about results — a weight, reps —
// and doesn't reach it. Orchestration only — the target edit is `withRoundTime`.

import { ConflictError } from '@domain/errors';
import type { SessionExercise } from '@domain/execution';
import { type RoundTimeColumn, withRoundTime } from '@domain/roundTimes';
import type { WorkoutStore } from '@repositories/workout';
import { openSessionExercise, type SessionExerciseRef } from '@usecases/openSession';

/**
 * Sets `column` of rounds `roundNumbers` of the exercise `ref` points at to `sec` — the round the
 * picker was opened on and the rounds below that followed it. Writes the plan only: the session
 * isn't started by it, and no status changes.
 *
 * Rejects with `ConflictError` when the exercise is skipped or one of the rounds is logged (un-log
 * it first), with `NotFoundError` for a round the exercise doesn't have, with an `Error` for a time
 * out of the picker's bounds, and as `openSessionExercise` does otherwise.
 */
export async function setRoundTime(
  ref: SessionExerciseRef,
  column: RoundTimeColumn,
  roundNumbers: readonly number[],
  sec: number,
  store: WorkoutStore,
): Promise<SessionExercise> {
  return store.transaction(async (repos) => {
    const { sessionExercise } = await openSessionExercise(ref, repos);
    if (sessionExercise.status === 'skipped') {
      throw new ConflictError(
        `Session exercise "${sessionExercise.id}" is skipped; unskip it before changing its rounds.`,
      );
    }
    const logs = await repos.roundLogRepo.listBySessionExerciseId(sessionExercise.id);
    const logged = roundNumbers.find((roundNumber) =>
      logs.some((log) => log.roundNumber === roundNumber),
    );
    if (logged !== undefined) {
      throw new ConflictError(
        `Round ${logged} of session exercise "${sessionExercise.id}" is logged; un-log it first.`,
      );
    }
    return repos.sessionExerciseRepo.update({
      ...sessionExercise,
      setTargets: withRoundTime(sessionExercise.setTargets, column, roundNumbers, sec),
    });
  });
}
