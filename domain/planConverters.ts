// WeekPlan <-> session converters — see 02 · Domain Model, "WeekPlan": "Один
// объект, один конвертер в каждую сторону." Kept separate from
// `domain/plan.ts` (types only) per the single-responsibility rule in
// AGENTS.md.

import type { Session, SessionExercise } from '@domain/execution';
import { generateId } from '@domain/id';
import type { WeekPlan, WeekPlanDay, WeekPlanExercise } from '@domain/plan';

/** A `Session` paired with the `SessionExercise`s planned within it. */
export type SessionWithExercises = {
  session: Session;
  exercises: SessionExercise[];
};

/**
 * Materializes a `WeekPlan` into one `Session` (plus its `SessionExercise`s) per day —
 * see 02 · Domain Model, "WeekPlan": "Один объект, один конвертер в каждую сторону."
 *
 * The resulting sessions are `ready` (the plan given here is already final — computing
 * it, whether from a template, a copied week, or the progression engine, is a separate
 * concern from materializing it) and `planned` (not yet started). `targetRir` is one
 * value for the whole week (03 · Progression Engine, Правило 4), applied to every
 * exercise; per-set `targetReps` is taken from `WeekPlanExercise.reps` when present
 * (Flow C) and left unset otherwise (Flow A/B, 02 · Domain Model, "WeekPlan").
 */
export function materializeWeekPlan(
  plan: WeekPlan,
  params: { mesoId: string; weekNumber: number; isDeload: boolean; targetRir: number },
): SessionWithExercises[] {
  return plan.days.map((day) => {
    const session: Session = {
      id: generateId(),
      mesoId: params.mesoId,
      weekNumber: params.weekNumber,
      dayNumber: day.dayNumber,
      name: day.name,
      isDeload: params.isDeload,
      prescriptionStatus: 'ready',
      status: 'planned',
    };

    const exercises: SessionExercise[] = day.exercises.map((exercise) => ({
      id: generateId(),
      sessionId: session.id,
      exerciseId: exercise.exerciseId,
      order: exercise.order,
      setTargets: Array.from({ length: exercise.sets }, (_, index) => ({
        setNumber: index + 1,
        targetReps: exercise.reps,
      })),
      targetRir: params.targetRir,
      status: 'planned',
    }));

    return { session, exercises };
  });
}

/**
 * Extracts a `WeekPlan` back out of a week's sessions, preserving day and exercise order
 * and composition — see 02 · Domain Model, "WeekPlan". Execution fields (status, logged
 * sets, weight hints, etc.) exist only on `Session` / `SessionExercise` and are dropped:
 * the result carries only what `WeekPlan` has room for.
 *
 * `reps` is reconstructed from the exercise's first `setTarget`'s `targetReps`, mirroring
 * `materializeWeekPlan`, which always assigns the same `targetReps` to every set target of
 * an exercise materialized from a `WeekPlan`.
 */
export function extractWeekPlan(sessionsWithExercises: readonly SessionWithExercises[]): WeekPlan {
  const days = sessionsWithExercises.map(({ session, exercises }): WeekPlanDay => {
    const sortedExercises = [...exercises].sort((a, b) => a.order - b.order);

    return {
      dayNumber: session.dayNumber,
      name: session.name ?? '',
      exercises: sortedExercises.map((exercise): WeekPlanExercise => {
        const reps = exercise.setTargets[0]?.targetReps;
        return reps === undefined
          ? { exerciseId: exercise.exerciseId, order: exercise.order, sets: exercise.setTargets.length }
          : {
              exerciseId: exercise.exerciseId,
              order: exercise.order,
              sets: exercise.setTargets.length,
              reps,
            };
      }),
    };
  });

  return { days: days.sort((a, b) => a.dayNumber - b.dayNumber) };
}
