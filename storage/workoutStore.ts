import type { WorkoutRepositories, WorkoutStore } from '@repositories/workout';

import { InMemorySessionRepository } from './session';
import { InMemorySessionExerciseRepository } from './sessionExercise';
import { InMemorySetLogRepository } from './setLogRepository';
import type { InMemoryStore } from './store';

function workoutRepositoriesOver(store: InMemoryStore): WorkoutRepositories {
  return {
    sessionRepo: new InMemorySessionRepository(store),
    sessionExerciseRepo: new InMemorySessionExerciseRepository(store),
    setLogRepo: new InMemorySetLogRepository(store),
  };
}

/**
 * The in-memory `WorkoutStore`: workout repositories over `store`, with transactions delegated to
 * `InMemoryStore.transaction`. The repositories handed to `work` are built over the transaction's
 * handle rather than reused from `repos` — the in-memory engine passes itself back so the two
 * coincide, but an adapter with a real transaction handle needs its writes to go through it.
 */
export function createInMemoryWorkoutStore(store: InMemoryStore): WorkoutStore {
  return {
    repos: workoutRepositoriesOver(store),
    transaction: (work) => store.transaction((handle) => work(workoutRepositoriesOver(handle))),
  };
}
