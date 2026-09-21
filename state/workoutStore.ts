// Composition root for the workout-screen use cases — see 08.7 · Тренировка (task 088). Same role
// as mesocycleStore.ts, and hooks for the same reason: app/ must not import @storage or
// @repositories directly (app/README.md, 07 · Persistence Layer Contract), and the repository set
// reaches a screen through context rather than a global (task 115).

import { useRepositories } from '@state/repositories';
import type { WorkoutStore } from '@repositories/workout';
import type { ExerciseAdditionDeps } from '@usecases/exerciseAddition';
import type { ExerciseSwapDeps } from '@usecases/exerciseSwap';
import type { MesocycleRepository } from '@repositories/mesocycle';
import type { SessionFinishDeps } from '@usecases/sessionFinish';
import type { TodayWorkoutDeps } from '@usecases/todayWorkout';
import type { WorkoutSessionDeps } from '@usecases/workoutSession';
import type { WorkoutSkipDeps } from '@usecases/workoutSkip';

export function useWorkoutSessionDeps(): WorkoutSessionDeps {
  const { sessionTreeRepo, sessionRepo } = useRepositories();
  return { sessionTreeRepo, sessionRepo };
}

/** What the Today tab's pick (099) reads: the workout screen's repositories, plus the mesocycles. */
export function useTodayWorkoutDeps(): TodayWorkoutDeps {
  const sessionDeps = useWorkoutSessionDeps();
  const { mesocycleRepo } = useRepositories();
  return { ...sessionDeps, mesocycleRepo };
}

/** The workout store the workout mutations (set logging 093, Finish 094) write through. */
export function useWorkoutStore(): WorkoutStore {
  return useRepositories().workoutStore;
}

/** What Finish workout (094) needs: the workout store, plus what next-week generation reads. */
export function useSessionFinishDeps(): SessionFinishDeps {
  const { workoutStore, mesocycleRepo, exerciseRepo } = useRepositories();
  return { workout: workoutStore, mesocycleRepo, exerciseRepo };
}

/** What Skip workout (096, 049) needs — the same as Finish: it generates next week's day too. */
export function useWorkoutSkipDeps(): WorkoutSkipDeps {
  return useSessionFinishDeps();
}

/**
 * What Add exercise (096, 048) needs: the workout store, the mesocycle for the week's RIR, and the
 * catalog for each exercise's equipment — a pure bodyweight one gets no weight target (105).
 */
export function useExerciseAdditionDeps(): ExerciseAdditionDeps {
  const { workoutStore, mesocycleRepo, exerciseRepo } = useRepositories();
  return { workout: workoutStore, mesocycleRepo, exerciseRepo };
}

/** The mesocycle the block's body weight is written to (105). */
export function useBodyWeightDeps(): MesocycleRepository {
  return useRepositories().mesocycleRepo;
}

/** What Replace exercise (097, 047) needs — the same as Add: rule 6 targets need the mesocycle. */
export function useExerciseSwapDeps(): ExerciseSwapDeps {
  return useExerciseAdditionDeps();
}
