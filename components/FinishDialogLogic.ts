// Pure, non-JSX logic behind FinishDialog.tsx (GT-220) — see the code-style skill.
//
// The popup sums up the day that just ended: one row per exercise of it, today's best set and what
// next week's same day does with it. The right column is not worked out here: it is read off the
// targets the engine already wrote into next week's session when the day was closed
// (`SessionFinishResult.nextExercises`), so the popup can never promise what the next workout
// doesn't hold.

import type { PlateTextPart } from '@design/components/PlateText';
import { formatClock } from '@design/formatClock';
import { isPureBodyWeight } from '@domain/bodyWeightLoad';
import type { SessionExercise, SessionStatus, SetTarget } from '@domain/execution';
import type { MesoGrid } from '@domain/mesoGrid';
import type { SessionFinishResult } from '@usecases/sessionFinish';
import type {
  RoundsWorkoutExercise,
  WorkoutExercise,
  WorkoutRoundRow,
  WorkoutSessionModel,
  WorkoutSetRow,
} from '@usecases/workoutSession';

import { formatLoggedWeight, formatRowWeight } from './WorkoutSetRowLogic';

/** One exercise of the day: its name, today's best, and the change next week (if any). */
export type FinishRow = {
  key: string;
  name: string;
  value: string;
  delta?: string;
};

/** What the popup's one button does. */
export type FinishAction = 'nextWorkout' | 'finishCycle' | 'close';

export type FinishSummary =
  | {
      kind: 'day';
      title: string;
      /** `5 exercises · 16 sets`. */
      subtitle: string;
      /** `Progression added to next week's Day 1.`, or the deload line. Absent when neither is true. */
      lead?: readonly PlateTextPart[];
      rows: FinishRow[];
      /** `Up next: Day 2` — the day the button opens. */
      upNext?: string;
      action: FinishAction;
      buttonLabel: string;
    }
  | {
      kind: 'cycle';
      title: string;
      /** `6 weeks · 23 of 24 workouts`. */
      subtitle: string;
      body: string;
      action: 'finishCycle';
      buttonLabel: string;
    };

export type FinishSummaryInput = {
  /** The closed session's exercises, as the read-only workout model shows them. */
  exercises: readonly WorkoutExercise[];
  weekNumber: number;
  dayNumber: number;
  /** The closed session's status: `skipped` when nothing at all was logged. */
  status: SessionStatus;
  /** Next week's session of the same day and its exercises; `null` after the deload week. */
  next: { isDeload: boolean; exercises: readonly SessionExercise[] } | null;
  /** The session `Next workout` opens, if any. */
  upNext?: { weekNumber: number; dayNumber: number };
  /** The block is done (every session final): the popup closes the cycle instead. */
  cycle?: { lengthWeeks: number; completedWorkouts: number; totalWorkouts: number };
};

export const CYCLE_DONE_BODY = 'Your next cycle can start from where this one ended.';

/**
 * What the popup is built from, once the screen has re-read the day it closed: its read-only model
 * (today's logs, and where `Next workout` goes) and the block's grid (that day's week and day, and
 * the cycle's count). `undefined` until both are the closed session's — the popup waits rather
 * than flash a half-read day.
 */
export function finishSummaryInput(
  closed: SessionFinishResult,
  model: WorkoutSessionModel | undefined,
  grid: MesoGrid | undefined,
): FinishSummaryInput | undefined {
  if (
    model === undefined ||
    model.sessionId !== closed.session.id ||
    model.mode !== 'readonly' ||
    grid === undefined ||
    grid.mesoId !== model.mesoId
  ) {
    return undefined;
  }
  const cells = grid.weeks.flatMap((week) => week.cells);
  const upNextCell =
    model.nextSessionId === undefined
      ? undefined
      : cells.find((cell) => cell.sessionId === model.nextSessionId);
  return {
    exercises: model.exercises,
    weekNumber: closed.session.weekNumber,
    dayNumber: closed.session.dayNumber,
    status: closed.session.status,
    next:
      closed.nextSession === null
        ? null
        : { isDeload: closed.nextSession.isDeload, exercises: closed.nextExercises },
    upNext:
      upNextCell === undefined
        ? undefined
        : { weekNumber: upNextCell.weekNumber, dayNumber: upNextCell.dayNumber },
    cycle: model.showFinishMesocycle
      ? {
          lengthWeeks: grid.lengthWeeks,
          completedWorkouts: cells.filter((cell) => cell.status === 'completed').length,
          totalWorkouts: cells.length,
        }
      : undefined,
  };
}

/** The popup for a session that was just finished or skipped. */
export function buildFinishSummary(input: FinishSummaryInput): FinishSummary {
  if (input.cycle !== undefined) {
    const { lengthWeeks, completedWorkouts, totalWorkouts } = input.cycle;
    return {
      kind: 'cycle',
      title: 'Cycle done',
      subtitle: `${plural(lengthWeeks, 'week')} · ${completedWorkouts} of ${totalWorkouts} workouts`,
      body: CYCLE_DONE_BODY,
      action: 'finishCycle',
      buttonLabel: 'Finish cycle',
    };
  }

  // Before a deload the right column goes: the whole next week is lighter, and one line says so
  // better than a `Go lighter` on every row.
  const showDelta = input.next !== null && !input.next.isDeload;
  const nextExercises = input.next?.exercises ?? [];
  const matchNext = nextExerciseMatcher(nextExercises);
  const rows = input.exercises.map((exercise) =>
    finishRow(exercise, showDelta ? matchNext(exercise.exerciseId) : undefined),
  );

  return {
    kind: 'day',
    title: `Day ${input.dayNumber} ${input.status === 'skipped' ? 'skipped' : 'done'}`,
    subtitle: `${plural(input.exercises.length, 'exercise')} · ${plural(doneCount(input.exercises), 'set')}`,
    lead: leadOf(input, rows),
    rows,
    upNext: input.upNext === undefined ? undefined : formatUpNext(input.upNext, input.weekNumber),
    action: input.upNext === undefined ? 'close' : 'nextWorkout',
    buttonLabel: input.upNext === undefined ? 'Done' : 'Next workout',
  };
}

function leadOf(
  input: FinishSummaryInput,
  rows: readonly FinishRow[],
): readonly PlateTextPart[] | undefined {
  if (input.next?.isDeload === true) {
    return ['Next week is a ', { strong: 'deload' }, '. Time to recover.'];
  }
  // Only when something really changes: a day that repeats as it was must not claim progression.
  if (rows.some((row) => row.delta !== undefined)) {
    return [{ strong: 'Progression added' }, ` to next week's Day ${input.dayNumber}.`];
  }
  return undefined;
}

/** `Day 2` in the same week, `Week 3 Day 1` once the next workout is in another one. */
export function formatUpNext(
  next: { weekNumber: number; dayNumber: number },
  weekNumber: number,
): string {
  return next.weekNumber === weekNumber
    ? `Day ${next.dayNumber}`
    : `Week ${next.weekNumber} Day ${next.dayNumber}`;
}

/** Sets logged plus rounds and blocks done — the `M sets` of the subtitle. */
function doneCount(exercises: readonly WorkoutExercise[]): number {
  return exercises.reduce(
    (sum, exercise) =>
      sum +
      ('rounds' in exercise
        ? exercise.rounds.filter((round) => round.log?.completed === true).length
        : exercise.rows.filter((row) => row.log !== undefined).length),
    0,
  );
}

/**
 * Next week's exercise for each of today's, by exercise: the same exercise can stand twice in a
 * day, so each match is taken once, in order.
 */
function nextExerciseMatcher(
  exercises: readonly SessionExercise[],
): (exerciseId: string) => SessionExercise | undefined {
  const left = [...exercises].sort((a, b) => a.order - b.order);
  return (exerciseId) => {
    const index = left.findIndex((exercise) => exercise.exerciseId === exerciseId);
    return index === -1 ? undefined : left.splice(index, 1)[0];
  };
}

/** One row of the list. A skipped exercise reads `Skipped`, with nothing on the right. */
export function finishRow(exercise: WorkoutExercise, next: SessionExercise | undefined): FinishRow {
  const base = { key: exercise.sessionExerciseId, name: exercise.name };
  if ('rounds' in exercise) {
    const done = exercise.rounds.filter((round) => round.log?.completed === true);
    if (done.length === 0) {
      return { ...base, value: 'Skipped' };
    }
    return {
      ...base,
      value: formatRounds(done),
      delta:
        exercise.type === 'interval' && next !== undefined
          ? intervalDelta(exercise, done, next.setTargets)
          : undefined,
    };
  }

  const best = bestSet(exercise.rows);
  if (best === undefined) {
    return { ...base, value: 'Skipped' };
  }
  return {
    ...base,
    value: formatSet(exercise, best.log),
    delta: next === undefined ? undefined : setDelta(best, next.setTargets),
  };
}

type LoggedSetRow = WorkoutSetRow & { log: NonNullable<WorkoutSetRow['log']> };

/** The heaviest set, and of those the one with the most reps; the first of equals. */
export function bestSet(rows: readonly WorkoutSetRow[]): LoggedSetRow | undefined {
  let best: LoggedSetRow | undefined;
  for (const row of rows) {
    if (row.log === undefined) {
      continue;
    }
    if (
      best === undefined ||
      row.log.weight > best.log.weight ||
      (row.log.weight === best.log.weight && row.log.reps > best.log.reps)
    ) {
      best = row as LoggedSetRow;
    }
  }
  return best;
}

/** `80 kg × 10`, `Level 2 × 3`, or `12 reps` where the load is the body or nothing. */
function formatSet(
  exercise: Exclude<WorkoutExercise, RoundsWorkoutExercise>,
  log: LoggedSetRow['log'],
): string {
  if (exercise.type === 'power') {
    if (exercise.powerLoad === 'none') {
      return `${log.reps} reps`;
    }
    if (exercise.powerLoad === 'level') {
      return `Level ${formatRowWeight(log.weight)} × ${log.reps}`;
    }
  }
  if (isPureBodyWeight(exercise.equipment)) {
    return `${log.reps} reps`;
  }
  return `${formatLoggedWeight(log, exercise.equipment)} kg × ${log.reps}`;
}

/**
 * What next week asks of today's best set, by the same set's target: a weight hint first — the
 * engine's own call that the weight should move — then a heavier or lighter weight, then more reps.
 * Nothing when the target repeats, is only an estimate, or isn't there.
 */
export function setDelta(best: LoggedSetRow, targets: readonly SetTarget[]): string | undefined {
  const target = targets.find((candidate) => candidate.setNumber === best.setNumber);
  if (target === undefined || target.estimate !== undefined) {
    return undefined;
  }
  const hints = targets.map((candidate) => candidate.weightHint);
  if (hints.includes('increase')) {
    return 'Go heavier';
  }
  if (hints.includes('decrease')) {
    return 'Go lighter';
  }
  if (target.suggestedWeight !== undefined && target.suggestedWeight !== best.log.weight) {
    return target.suggestedWeight > best.log.weight ? 'Go heavier' : 'Go lighter';
  }
  if (target.targetReps !== undefined && target.targetReps > best.log.reps) {
    return `+${plural(target.targetReps - best.log.reps, 'rep')}`;
  }
  return undefined;
}

/** `4 × 0:40` — the rounds done and the work of the last one; one round reads `0:40`. */
function formatRounds(done: readonly WorkoutRoundRow[]): string {
  const work = done[done.length - 1]?.log?.workSec ?? 0;
  return done.length === 1 ? formatClock(work) : `${done.length} × ${formatClock(work)}`;
}

/**
 * The interval lever's step, read off next week's rounds against today's: one round more, more
 * work, or less rest (10.1 FR-8). The lever moves one of them at a time.
 */
function intervalDelta(
  exercise: RoundsWorkoutExercise,
  done: readonly WorkoutRoundRow[],
  targets: readonly SetTarget[],
): string | undefined {
  if (targets.length > exercise.rounds.length) {
    return `+${plural(targets.length - exercise.rounds.length, 'round')}`;
  }
  const last = done[done.length - 1]?.log;
  const nextRound = targets.find(
    (target) => target.setNumber === done[done.length - 1]?.roundNumber,
  );
  if (last === undefined || nextRound === undefined) {
    return undefined;
  }
  if (nextRound.targetWorkSec !== undefined && nextRound.targetWorkSec > last.workSec) {
    return `+${nextRound.targetWorkSec - last.workSec} s`;
  }
  if (
    nextRound.targetRestSec !== undefined &&
    last.restSec !== undefined &&
    nextRound.targetRestSec < last.restSec
  ) {
    return `−${last.restSec - nextRound.targetRestSec} s rest`;
  }
  return undefined;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
