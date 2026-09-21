// Composition root for the workout-screen use cases — see 08.7 · Тренировка (task 088). Same role
// as mesocycleStore.ts, and functions for the same reason: app/ must not import @storage or
// @repositories directly (app/README.md, 07 · Persistence Layer Contract), and the repository set
// is installed at startup rather than built at import (task 111).

import { repositories } from '@state/repositories';
import type { WorkoutStore } from '@repositories/workout';
import type { ExerciseAdditionDeps } from '@usecases/exerciseAddition';
import type { ExerciseSwapDeps } from '@usecases/exerciseSwap';
import type { MesocycleRepository } from '@repositories/mesocycle';
import type { SessionFinishDeps } from '@usecases/sessionFinish';
import type { TodayWorkoutDeps } from '@usecases/todayWorkout';
import type { WorkoutSessionDeps } from '@usecases/workoutSession';
import type { WorkoutSkipDeps } from '@usecases/workoutSkip';

export function workoutSessionDeps(): WorkoutSessionDeps {
  const { sessionTreeRepo, sessionRepo } = repositories();
  return { sessionTreeRepo, sessionRepo };
}

/** What the Today tab's pick (099) reads: the workout screen's repositories, plus the mesocycles. */
export function todayWorkoutDeps(): TodayWorkoutDeps {
  const { mesocycleRepo } = repositories();
  return { ...workoutSessionDeps(), mesocycleRepo };
}

/** The workout store the workout mutations (set logging 093, Finish 094) write through. */
export function workoutStore(): WorkoutStore {
  return repositories().workoutStore;
}

/** What Finish workout (094) needs: the workout store, plus what next-week generation reads. */
export function sessionFinishDeps(): SessionFinishDeps {
  const { workoutStore: workout, mesocycleRepo, exerciseRepo } = repositories();
  return { workout, mesocycleRepo, exerciseRepo };
}

/** What Skip workout (096, 049) needs — the same as Finish: it generates next week's day too. */
export function workoutSkipDeps(): WorkoutSkipDeps {
  return sessionFinishDeps();
}

/**
 * What Add exercise (096, 048) needs: the workout store, the mesocycle for the week's RIR, and the
 * catalog for each exercise's equipment — a pure bodyweight one gets no weight target (105).
 */
export function exerciseAdditionDeps(): ExerciseAdditionDeps {
  const { workoutStore: workout, mesocycleRepo, exerciseRepo } = repositories();
  return { workout, mesocycleRepo, exerciseRepo };
}

/** The mesocycle the block's body weight is written to (105). */
export function bodyWeightDeps(): MesocycleRepository {
  return repositories().mesocycleRepo;
}

/** What Replace exercise (097, 047) needs — the same as Add: rule 6 targets need the mesocycle. */
export function exerciseSwapDeps(): ExerciseSwapDeps {
  return exerciseAdditionDeps();
}
