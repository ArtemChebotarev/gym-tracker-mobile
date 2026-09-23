// WeekPlan <-> session converters — see 02 · Domain Model, "WeekPlan": "Один
// объект, один конвертер в каждую сторону." Kept separate from
// `domain/plan.ts` (types only) per the single-responsibility rule in
// AGENTS.md.

import type { Session, SessionExercise } from '@domain/execution';
import { generateId } from '@domain/id';
import type { WeekPlan, WeekPlanDay, WeekPlanExercise } from '@domain/plan';
import type { Unsaved } from '@domain/timestamps';

/**
 * A `Session` paired with the `SessionExercise`s planned within it, before either has been
 * stored — the domain builds records, the adapter stamps them (domain/timestamps.ts). Entities
 * read back out of a repository carry their stamps on top and fit this shape too, which is what
 * lets `extractWeekPlan` take what `materializeWeekPlan` produced or what storage returned.
 */
export type SessionWithExercises = {
  session: Unsaved<Session>;
  exercises: Unsaved<SessionExercise>[];
};

/**
 * Materializes a `WeekPlan` into one `Session` (plus its `SessionExercise`s) per day —
 * see 02 · Domain Model, "WeekPlan": "Один объект, один конвертер в каждую сторону."
 *
 * The resulting sessions are `ready` (the plan given here is already final — computing
 * it, whether from a template, a copied week, or the progression engine, is a separate
 * concern from materializing it) and `planned` (not yet started). `targetRir` is one
 * value for the whole week (03 · Progression Engine, Правило 4), applied to every
 * exercise. Set targets come out bare — one per `sets`, numbered from 1, with no
 * `targetReps`: a `WeekPlan` holds no reps in any flow, and where week 1 does get them
 * (Flow C) they are computed at Start from the exercise's history, not carried in the
 * plan (04 · Meso Creation Flows, "Расчёт startReps"; task 041).
 */
export function materializeWeekPlan(
  plan: WeekPlan,
  params: { mesoId: string; weekNumber: number; isDeload: boolean; targetRir: number },
): SessionWithExercises[] {
  return plan.days.map((day) => {
    const session: Unsaved<Session> = {
      id: generateId(),
      mesoId: params.mesoId,
      weekNumber: params.weekNumber,
      dayNumber: day.dayNumber,
      name: day.name,
      isDeload: params.isDeload,
      prescriptionStatus: 'ready',
      status: 'planned',
    };

    const exercises: Unsaved<SessionExercise>[] = day.exercises.map((exercise) => ({
      id: generateId(),
      sessionId: session.id,
      exerciseId: exercise.exerciseId,
      order: exercise.order,
      setTargets: Array.from({ length: exercise.sets }, (_, index) => ({
        setNumber: index + 1,
      })),
      targetRir: params.targetRir,
      status: 'planned',
    }));

    return { session, exercises };
  });
}

/**
 * Extracts a `WeekPlan` back out of a week's sessions, preserving day and exercise order
 * and composition — see 02 · Domain Model, "WeekPlan". The week is read as it actually
 * ended: an exercise swapped mid-week comes back as the one performed, a reordered day
 * comes back in its final order, and a removed exercise simply isn't there.
 *
 * Only structure survives. Execution (statuses, logged sets) and prescription (target reps,
 * suggested weights, weight hints, the week's RIR) live on `Session` / `SessionExercise`
 * and are dropped — `WeekPlan` has no room for either. `sets` is the number of set rows the
 * exercise actually ended up with, not the number it was planned with. Both callers want
 * exactly that much: Flow C copies the structure and computes its targets at Start from
 * history (04 · Meso Creation Flows, "Что копируется"), and saving a mesocycle as a
 * template keeps no execution at all (043).
 *
 * Whether the week may be copied in the first place is not this function's call — a deload
 * week can't be (`validateCopyableSourceWeek`), and a week that was never generated has no
 * sessions to pass in here.
 */
export function extractWeekPlan(sessionsWithExercises: readonly SessionWithExercises[]): WeekPlan {
  const days = sessionsWithExercises.map(({ session, exercises }): WeekPlanDay => ({
    dayNumber: session.dayNumber,
    name: session.name ?? '',
    exercises: [...exercises]
      .sort((a, b) => a.order - b.order)
      .map(
        (exercise): WeekPlanExercise => ({
          exerciseId: exercise.exerciseId,
          order: exercise.order,
          sets: exercise.setTargets.length,
        }),
      ),
  }));

  return { days: days.sort((a, b) => a.dayNumber - b.dayNumber) };
}
