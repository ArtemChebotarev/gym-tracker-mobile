// An interval exercise's next-week rounds as the fact leaves them (GT-93; 03, "Структура
// наследуется от факта"): one round per round of the source, so rounds added or removed in the
// workout stay, each with the times it was done with (`roundTimesOf`). And whether every one of
// them was done — what the lever rule steps on (GT-100). And the rounds a past performance hands to
// a slot that picks it as its reference — a block's start, or an exercise added or swapped in
// (GT-185). Pure.

import type { RoundLog, SessionExercise, SetTarget } from '@domain/execution';
import type { ExercisePerformance } from '@domain/progression';
import { roundTimesOf, type RoundTimes } from '@domain/roundTimes';

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

/**
 * The rounds `performance` hands on as a reference (10.1 FR-9; GT-185): each planned round with the
 * times it ended with — `roundTimesOf`, so a skipped rest or a round ended early keeps its plan —
 * in round order. A round logged that its plan no longer has (a performance from before rounds were
 * planned) hands on its log alone. A strength or power performance has none.
 */
export function referenceRounds(
  performance: Pick<ExercisePerformance, 'roundLogs' | 'roundTargets'>,
): RoundTimes[] {
  const logByRound = new Map<number, RoundLog>();
  for (const log of performance.roundLogs) {
    if (!logByRound.has(log.roundNumber)) {
      logByRound.set(log.roundNumber, log);
    }
  }
  const planned = new Map(performance.roundTargets.map((target) => [target.setNumber, target]));
  const roundNumbers = [...new Set([...planned.keys(), ...logByRound.keys()])].sort(
    (a, b) => a - b,
  );
  return roundNumbers.map((roundNumber) =>
    roundTimesOf(planned.get(roundNumber), logByRound.get(roundNumber)),
  );
}

/**
 * `rowCount` rounds priced from a reference's rounds (FR-9, GT-185): round N takes round N's work and
 * rest, and a round past the reference's last takes the last one's. The times are a plan, not a
 * result, so there is no lever step at a block's border or in a slot new to the exercise. Only the
 * rounds that have both times count; with none, the rounds come with no times, to be picked on the
 * card (GT-187).
 */
export function roundsFromReference(
  reference: readonly RoundTimes[],
  rowCount: number,
): SetTarget[] {
  const timed = reference.filter(
    (round) => round.targetWorkSec !== undefined && round.targetRestSec !== undefined,
  );
  return Array.from({ length: rowCount }, (_, index) => ({
    setNumber: index + 1,
    ...(timed[index] ?? timed.at(-1) ?? {}),
  }));
}
