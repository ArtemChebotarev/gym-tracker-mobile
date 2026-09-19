// Composition root for the workout-screen use cases — see 08.7 · Тренировка (task 088). Same role
// as mesocycleStore.ts: app/ must not import @storage or @repositories directly (app/README.md,
// 07 · Persistence Layer Contract), so the repositories a workout query needs are built here, over
// the app-wide store.

import { InMemoryExerciseRepository } from '@storage/exerciseRepository';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import { InMemorySessionRepository } from '@storage/session';
import { InMemorySessionTreeRepository } from '@storage/sessionTree';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';
import type { WorkoutStore } from '@repositories/workout';
import type { ExerciseAdditionDeps } from '@usecases/exerciseAddition';
import type { ExerciseSwapDeps } from '@usecases/exerciseSwap';
import type { SessionFinishDeps } from '@usecases/sessionFinish';
import type { TodayWorkoutDeps } from '@usecases/todayWorkout';
import type { WorkoutSessionDeps } from '@usecases/workoutSession';
import type { WorkoutSkipDeps } from '@usecases/workoutSkip';

import { appStore } from './appStore';

export const workoutSessionDeps: WorkoutSessionDeps = {
  sessionTreeRepo: new InMemorySessionTreeRepository(appStore),
  sessionRepo: new InMemorySessionRepository(appStore),
};

/** What the Today tab's pick (099) reads: the workout screen's repositories, plus the mesocycles. */
export const todayWorkoutDeps: TodayWorkoutDeps = {
  ...workoutSessionDeps,
  mesocycleRepo: new InMemoryMesocycleRepository(appStore),
};

/** The workout store the workout mutations (set logging 093, Finish 094) write through. */
export const workoutStore: WorkoutStore = createInMemoryWorkoutStore(appStore);

/** What Finish workout (094) needs: the workout store, plus what next-week generation reads. */
export const sessionFinishDeps: SessionFinishDeps = {
  workout: workoutStore,
  mesocycleRepo: new InMemoryMesocycleRepository(appStore),
  exerciseRepo: new InMemoryExerciseRepository(appStore),
};

/** What Skip workout (096, 049) needs — the same as Finish: it generates next week's day too. */
export const workoutSkipDeps: WorkoutSkipDeps = sessionFinishDeps;

/** What Add exercise (096, 048) needs: the workout store, plus the mesocycle for the week's RIR. */
export const exerciseAdditionDeps: ExerciseAdditionDeps = {
  workout: workoutStore,
  mesocycleRepo: new InMemoryMesocycleRepository(appStore),
};

/** What Replace exercise (097, 047) needs — the same as Add: rule 6 targets need the mesocycle. */
export const exerciseSwapDeps: ExerciseSwapDeps = exerciseAdditionDeps;
