// Progression policy for `interval` exercises — 10 · Hybrid Exercises, "Interval: рычаги
// прогрессии". An interval exercise's unit is the round, not a set of reps, and what it progresses
// on is a lever chosen per exercise in its cycle (`rest`, `workTime`, `rounds`, `none`).
//
// - Working week: the rounds the fact leaves (GT-93); every round done → one lever step, otherwise
//   the plan repeats (GT-100). With no lever given, nothing is recommended (03, "Не уверен — не
//   рекомендуй") and the plan repeats.
// - Deload day: the plan repeats, with no step, until the interval's own deload (GT-105).
// - Rule 6 and a copied block's start: the rounds of the reference the resolver found for the slot
//   (day + exercise), as they ended — round N from round N, past its last from its last — and no
//   lever step: a round's times are a plan, not a result to add to (10.1 FR-9; GT-185). With no
//   reference, rounds with no times, picked on the card (GT-187).

import { stepIntervalLever } from '@domain/progressionLeverInterval';
import type { ProgressionPolicy, ReferenceTargetsInput } from '@domain/progressionPolicy';
import { targetRir } from '@domain/progressionRir';
import {
  allIntervalRoundsDone,
  inheritedIntervalRounds,
  intervalLogsByRound,
  referenceRounds,
  roundsFromReference,
} from '@domain/progressionRoundsInterval';

export const intervalPolicy: ProgressionPolicy = {
  sourceFacts: (settings) =>
    settings?.type === 'interval'
      ? { intervalProgression: { lever: settings.lever, stepSec: settings.stepSec } }
      : {},
  prescribeWorkingWeek(
    { sessionExercise, intervalProgression },
    { roundLogs, weekNumber, lengthWeeks },
  ) {
    const logByRound = intervalLogsByRound(sessionExercise, roundLogs);
    const rounds = inheritedIntervalRounds(sessionExercise.setTargets, logByRound);
    const steps =
      intervalProgression !== undefined &&
      allIntervalRoundsDone(sessionExercise.setTargets, logByRound);
    return {
      exerciseId: sessionExercise.exerciseId,
      order: sessionExercise.order,
      setTargets: steps ? stepIntervalLever(rounds, intervalProgression) : rounds,
      // An interval has no RIR on screen, but every session exercise carries the week's.
      targetRir: targetRir(lengthWeeks, weekNumber),
    };
  },
  prescribeDeload: (exercises, { roundLogs, settings }) =>
    exercises.map(({ sessionExercise }) => ({
      exerciseId: sessionExercise.exerciseId,
      order: sessionExercise.order,
      setTargets: inheritedIntervalRounds(
        sessionExercise.setTargets,
        intervalLogsByRound(sessionExercise, roundLogs),
      ),
      targetRir: settings.deloadRir,
    })),
  prescribeFromReference: roundsForSlot,
  prescribeBlockStart: roundsForSlot,
};

/**
 * `rowCount` rounds from what the resolver found. A target and an estimate are read alike: an
 * estimate differs from a target by the +1 it doesn't get, and a round never gets one.
 */
function roundsForSlot({ resolution, rowCount }: ReferenceTargetsInput) {
  const reference = resolution.kind === 'none' ? [] : referenceRounds(resolution.reference);
  return roundsFromReference(reference, rowCount);
}
