// Composition root for the workout-screen use cases — see 08.7 · Тренировка (task 088). Same role
// as mesocycleStore.ts: app/ must not import @storage or @repositories directly (app/README.md,
// 07 · Persistence Layer Contract), so the repositories a workout query needs are built here, over
// the app-wide store.

import { InMemorySessionRepository } from '@storage/session';
import { InMemorySessionTreeRepository } from '@storage/sessionTree';
import type { WorkoutSessionDeps } from '@usecases/workoutSession';

import { appStore } from './appStore';

export const workoutSessionDeps: WorkoutSessionDeps = {
  sessionTreeRepo: new InMemorySessionTreeRepository(appStore),
  sessionRepo: new InMemorySessionRepository(appStore),
};
