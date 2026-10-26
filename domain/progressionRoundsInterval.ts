// An interval exercise's next-week rounds as the fact leaves them (GT-93; 03, "Структура
// наследуется от факта"): one round per round of the source, so rounds added or removed in the
// workout stay, each with the times it was done with (`roundTimesOf`). And whether every one of
// them was done — what the lever rule steps on (GT-100). Pure.

import type { RoundLog, SessionExercise, SetTarget } from '@domain/execution';
import { roundTimesOf } from '@domain/roundTimes';

/** The first log of each round of `sessionExercise`; logs of other exercises are ignored. */
export function intervalLogsByRound(
  sessionExercise: Pick<SessionExercise, 'id'>,
  roundLogs: readonly RoundLog[],
): Map<number, RoundLog> {
  const logByRound = new Map<number, RoundLog>();
  for (const log of roundLogs) {
    if (log.sessionExerciseId === sessionExercise.id && !logByRound.has(log.roundNumber)) {
      logByRound.set(log.roundNumber, log);
    }
  }
  return logByRound;
}

/** The source's rounds with the times each hands on to next week. */
export function inheritedIntervalRounds(
  planned: readonly SetTarget[],
  logByRound: ReadonlyMap<number, RoundLog>,
): SetTarget[] {
  return planned.map((round) => ({
    setNumber: round.setNumber,
    ...roundTimesOf(round, logByRound.get(round.setNumber)),
  }));
}

/**
 * Whether every round of `planned` was done: logged, and not cut short with End early (FR-6). An
 * exercise with no rounds has none done.
 */
export function allIntervalRoundsDone(
  planned: readonly Pick<SetTarget, 'setNumber'>[],
  logByRound: ReadonlyMap<number, Pick<RoundLog, 'completed'>>,
): boolean {
  return planned.length > 0 && planned.every((round) => logByRound.get(round.setNumber)?.completed);
}
