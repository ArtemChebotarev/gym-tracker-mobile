// Workout screen rules — see 08.7 · Тренировка ("Режимы экрана", "Шапка", "Кнопка Finish workout",
// "Preview непосчитанного дня") and 05 · Workout Execution & Logging. Pure: the use case layer reads
// the session tree and maps it with these.

import type { Session, SessionExercise, SetLog, SetTarget, WeightHint } from '@domain/execution';
import type { Mesocycle, ProgressionSettings } from '@domain/mesocycle';
import { isFinalMesocycle } from '@domain/mesocycleLifecycle';
import { isNotDone } from '@domain/sessionExerciseStatus';
import { isFinalSession } from '@domain/sessionLifecycle';
import type { WorkoutMode, WorkoutSlot } from '@domain/workoutView';

/**
 * The screen mode a session opens in (08.7, "Режимы экрана").
 *
 * The block decides first: every session of one that has ended — finished or stopped — opens in
 * `history`, whatever its own status (08.9, "History-режим экрана тренировки"). There is no route
 * parameter for it, so the one place that could get it wrong is this function. A closed block has
 * no non-final session left to tell apart anyway — Stop closes each of them (05) — so `history`
 * replaces `readonly` there rather than competing with `live` or `preview`.
 */
export function workoutMode(
  session: Pick<Session, 'status' | 'prescriptionStatus'>,
  mesocycle: Pick<Mesocycle, 'status'>,
): WorkoutMode {
  if (isFinalMesocycle(mesocycle)) {
    return 'history';
  }
  if (isFinalSession(session)) {
    return 'readonly';
  }
  return session.prescriptionStatus === 'awaiting_source' ? 'preview' : 'live';
}

/**
 * The date shown under the session title (08.7, "Шапка"): `completedAt` for a completed session,
 * `startedAt` for one that was started, none for one that hasn't been.
 */
export function sessionDisplayDate(
  session: Pick<Session, 'status' | 'startedAt' | 'completedAt'>,
): string | undefined {
  return session.status === 'completed' ? session.completedAt : session.startedAt;
}

/** One exercise's rows and the set numbers logged against them. */
export type ProgressExercise = {
  sessionExercise: Pick<SessionExercise, 'setTargets' | 'status'>;
  setLogs: readonly Pick<SetLog, 'setNumber'>[];
};

/**
 * Share of the session's set rows that are done, 0..1 (08.7, "Шапка", progress bar): logged rows
 * plus every row of a skipped or abandoned exercise (`isNotDone`), over all rows. A completed session is always 1; a session
 * with no rows is 0.
 */
export function sessionProgress(
  session: Pick<Session, 'status'>,
  exercises: readonly ProgressExercise[],
): number {
  if (session.status === 'completed') {
    return 1;
  }
  let total = 0;
  let done = 0;
  for (const { sessionExercise, setLogs } of exercises) {
    const rows = sessionExercise.setTargets.length;
    total += rows;
    if (isNotDone(sessionExercise.status)) {
      done += rows;
    } else {
      const logged = new Set(setLogs.map((log) => log.setNumber));
      done += sessionExercise.setTargets.filter((target) => logged.has(target.setNumber)).length;
    }
  }
  return total === 0 ? 0 : done / total;
}

/**
 * Whether a session can be finished (05, "Завершение тренировки"; 08.7, "Кнопка Finish workout"):
 * every exercise is `completed` or `skipped`.
 */
export function canFinishSession(
  sessionExercises: readonly Pick<SessionExercise, 'status'>[],
): boolean {
  return sessionExercises.every((exercise) => exercise.status !== 'planned');
}

/**
 * The session whose exercise list a preview of `slot` shows (08.7, "Preview непосчитанного дня"):
 * the latest programmed session of the same day in the same mesocycle, before `slot`'s week — the
 * one whose structure the slot will inherit. `undefined` when there is none.
 */
export function previewSourceSession<S extends Session>(
  slot: WorkoutSlot,
  mesoSessions: readonly S[],
): S | undefined {
  return mesoSessions
    .filter(
      (session) =>
        session.mesoId === slot.mesoId &&
        session.dayNumber === slot.dayNumber &&
        session.weekNumber < slot.weekNumber &&
        session.prescriptionStatus === 'ready',
    )
    .reduce<S | undefined>(
      (latest, session) =>
        latest === undefined || session.weekNumber > latest.weekNumber ? session : latest,
      undefined,
    );
}

/**
 * The session whose Finish programs `slot` (08.7, "Unlocks when you finish Week W Day D"): the same
 * day of the previous week.
 */
export function unlockingSlot(slot: WorkoutSlot): WorkoutSlot {
  return { ...slot, weekNumber: slot.weekNumber - 1 };
}

/** A weight hint as the exercise card shows it: the direction, and the rep bound behind it. */
export type ExerciseWeightHint = {
  direction: WeightHint;
  /** `maxReps` for `increase` (reps reached it), `minReps` for `decrease` (reps fell under it). */
  reps: number;
};

/**
 * The weight hints (03 · Progression Engine, rule 3) of an exercise's set rows, each direction
 * once — `increase` first. A hint is set per row from that set's fact last week; the card names
 * the direction once for the exercise, and the rows' reps show which sets it's about.
 */
export function exerciseWeightHints(
  setTargets: readonly Pick<SetTarget, 'weightHint'>[],
  settings: Pick<ProgressionSettings, 'minReps' | 'maxReps'>,
): ExerciseWeightHint[] {
  const hints: ExerciseWeightHint[] = [];
  if (setTargets.some((target) => target.weightHint === 'increase')) {
    hints.push({ direction: 'increase', reps: settings.maxReps });
  }
  if (setTargets.some((target) => target.weightHint === 'decrease')) {
    hints.push({ direction: 'decrease', reps: settings.minReps });
  }
  return hints;
}
