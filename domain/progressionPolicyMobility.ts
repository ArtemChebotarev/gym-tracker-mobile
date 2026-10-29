// Progression policy for `mobility` exercises — 10 · Hybrid Exercises, "Mobility: место определяет
// пользователь" (GT-106). A stretch or a hang to unload has no progression at all: no targets, no
// increment, no RIR on screen, and a deload changes nothing. What it plans is its block — its
// length, which comes from history like an interval round's work (10.1 FR-9, FR-10).
//
// - Working week and deload day: the blocks the source had, each with the length it was done with
//   (`roundTimesOf`), its planned one while not logged. Reps and loads are never carried — a
//   mobility exercise logged as sets before its card (GT-107) hands on nothing of them.
// - Rule 6 and a copied block's start: the length of the reference the resolver found for the
//   slot, as it ended; with no reference, no length — picked on the card.
//
// It also takes no part in weight swap (`usesTargetIndicator`) or in volume (`buildMesoSummary`).

import type { RoundLog, SessionExercise, SetTarget } from '@domain/execution';
import type { ProgressionPolicy, ReferenceTargetsInput } from '@domain/progressionPolicy';
import { targetRir } from '@domain/progressionRir';
import { intervalLogsByRound, referenceRounds } from '@domain/progressionRoundsInterval';
import { roundTimesOf } from '@domain/roundTimes';

export const mobilityPolicy: ProgressionPolicy = {
  sourceFacts: () => ({}),
  prescribeWorkingWeek: ({ sessionExercise }, { roundLogs, weekNumber, lengthWeeks }) => ({
    exerciseId: sessionExercise.exerciseId,
    order: sessionExercise.order,
    setTargets: inheritedBlocks(sessionExercise, roundLogs),
    // Mobility has no RIR on screen, but every session exercise carries the week's.
    targetRir: targetRir(lengthWeeks, weekNumber),
  }),
  prescribeDeload: (exercises, { roundLogs, settings }) =>
    exercises.map(({ sessionExercise }) => ({
      exerciseId: sessionExercise.exerciseId,
      order: sessionExercise.order,
      setTargets: inheritedBlocks(sessionExercise, roundLogs),
      targetRir: settings.deloadRir,
    })),
  prescribeFromReference: blocksForSlot,
  prescribeBlockStart: blocksForSlot,
};

/** The source's blocks with the length each hands on to next week, and nothing else. */
function inheritedBlocks(
  sessionExercise: Pick<SessionExercise, 'id' | 'setTargets'>,
  roundLogs: readonly RoundLog[],
): SetTarget[] {
  const logByRound = intervalLogsByRound(sessionExercise, roundLogs);
  return sessionExercise.setTargets.map((block) =>
    withLength(block.setNumber, roundTimesOf(block, logByRound.get(block.setNumber)).targetWorkSec),
  );
}

/**
 * `rowCount` blocks from what the resolver found: block N takes the length of the reference's
 * block N, a block past its last the last one's. A length is a plan, not a result: no step.
 */
function blocksForSlot({ resolution, rowCount }: ReferenceTargetsInput): SetTarget[] {
  const lengths = (resolution.kind === 'none' ? [] : referenceRounds(resolution.reference))
    .map((block) => block.targetWorkSec)
    .filter((sec) => sec !== undefined);
  return Array.from({ length: rowCount }, (_, index) =>
    withLength(index + 1, lengths[index] ?? lengths.at(-1)),
  );
}

function withLength(setNumber: number, workSec: number | undefined): SetTarget {
  return workSec === undefined ? { setNumber } : { setNumber, targetWorkSec: workSec };
}
