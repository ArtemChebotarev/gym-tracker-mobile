// Changing a running block's length — GT-240 (03 · Progression Engine, rule 4, "Смена длины
// запущенного цикла"; 08.7, "Лист «Обзор мезоцикла»"). Pure: the use case reads the block and its
// sessions and persists what this returns.
//
// Deload is always the last week, so a new length moves the deload. A started week keeps its role
// and RIR: once anything in it is logged or closed, they are history. Nothing about the curve is
// stored: every working week is planned from the week before it, at rule 4's table of the current
// length kept within one step of that week's RIR (`clampedTargetRir`) — so a longer block never
// climbs back up and a shorter one never drops by more than 1 a week.

import { ConflictError } from '@domain/errors';
import type { Session, SessionExercise } from '@domain/execution';
import type { Mesocycle } from '@domain/mesocycle';
import { MAX_LENGTH_WEEKS, MIN_EDITOR_LENGTH_WEEKS } from '@domain/mesocycleValidators';
import type { ExercisePrescription } from '@domain/progression';

/**
 * The last started week of the block: the highest week with a session that has left `planned` —
 * one with a set logged is `in_progress` or closed, and a skipped day is closed too, with its next
 * week already generated. 0 while nothing has been started.
 */
export function lastStartedWeek(
  sessions: readonly Pick<Session, 'weekNumber' | 'status'>[],
): number {
  return Math.max(
    0,
    ...sessions.filter((session) => session.status !== 'planned').map((s) => s.weekNumber),
  );
}

export type LengthBounds = { min: number; max: number };

/**
 * How short and how long the block may be made now. The deload has to land on a week nothing has
 * touched, so the shortest is the last started week + 1 — and never under the editor's floor of 4
 * (GT-45; a 3-week block left from before it can only grow). Once the deload itself is started the
 * length is locked: making the block longer would turn a week trained as a deload into a working
 * one.
 */
export function mesocycleLengthBounds(
  mesocycle: Pick<Mesocycle, 'lengthWeeks'>,
  sessions: readonly Pick<Session, 'weekNumber' | 'status'>[],
): LengthBounds {
  const started = lastStartedWeek(sessions);
  if (started >= mesocycle.lengthWeeks) {
    return { min: mesocycle.lengthWeeks, max: mesocycle.lengthWeeks };
  }
  const floor = Math.min(mesocycle.lengthWeeks, MIN_EDITOR_LENGTH_WEEKS);
  return { min: Math.max(floor, started + 1), max: MAX_LENGTH_WEEKS };
}

/**
 * `mesocycle` at `lengthWeeks`. Throws `ConflictError` unless the block is `active` and the length
 * is within `mesocycleLengthBounds` — no deload on a started week, nothing outside 4..8.
 */
export function mesocycleWithLength(
  mesocycle: Mesocycle,
  sessions: readonly Pick<Session, 'weekNumber' | 'status'>[],
  lengthWeeks: number,
): Mesocycle {
  if (mesocycle.status !== 'active') {
    throw new ConflictError(
      `Mesocycle "${mesocycle.id}" is ${mesocycle.status}; only an active one changes length.`,
    );
  }
  const { min, max } = mesocycleLengthBounds(mesocycle, sessions);
  if (!Number.isInteger(lengthWeeks) || lengthWeeks < min || lengthWeeks > max) {
    throw new ConflictError(
      `Mesocycle "${mesocycle.id}" can be ${min} to ${max} weeks long now, got ${lengthWeeks}.`,
    );
  }
  return { ...mesocycle, lengthWeeks };
}

/**
 * The exercises of an untouched, already generated session after a length change. `prescriptions`
 * is the session planned again from its source — present only when its week changed role (became
 * the deload or stopped being it); otherwise only the week's `targetRir` moves, since working-week
 * targets are progressed from the source's fact and not from the RIR (03, rules 1–3).
 *
 * A planned row is matched to a prescription by exercise, in order; a row that matches none (added
 * or swapped in before the session started) keeps itself with the week's `targetRir` — and, on a
 * deload, loses its numbers: a deload looks up no reference for anyone (03, rule 6).
 */
export function replannedSessionExercises(
  exercises: readonly SessionExercise[],
  plan: { targetRir: number; isDeload: boolean; prescriptions?: readonly ExercisePrescription[] },
): SessionExercise[] {
  const { prescriptions, targetRir, isDeload } = plan;
  if (prescriptions === undefined) {
    return exercises.map((exercise) => ({ ...exercise, targetRir }));
  }
  const unused = [...prescriptions];
  return exercises.map((exercise) => {
    const index = unused.findIndex((candidate) => candidate.exerciseId === exercise.exerciseId);
    if (index >= 0) {
      const [prescription] = unused.splice(index, 1) as [ExercisePrescription];
      return {
        ...exercise,
        setTargets: prescription.setTargets,
        targetRir: prescription.targetRir,
      };
    }
    return isDeload
      ? {
          ...exercise,
          targetRir,
          setTargets: exercise.setTargets.map(({ setNumber }) => ({ setNumber })),
        }
      : { ...exercise, targetRir };
  });
}
