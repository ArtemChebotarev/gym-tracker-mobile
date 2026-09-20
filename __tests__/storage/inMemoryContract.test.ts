import { InMemoryExerciseHistoryRepository } from '@storage/exerciseHistory';
import { InMemoryExerciseRepository } from '@storage/exerciseRepository';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import { createInMemoryMesocycleStartStore } from '@storage/mesocycleStartStore';
import { InMemoryMuscleGroupRepository } from '@storage/muscleGroupRepository';
import { InMemorySessionRepository } from '@storage/session';
import { InMemorySessionExerciseRepository } from '@storage/sessionExercise';
import { InMemorySessionTreeRepository } from '@storage/sessionTree';
import { InMemorySetLogRepository } from '@storage/setLogRepository';
import { InMemorySettingsRepository } from '@storage/settings';
import { InMemoryStore } from '@storage/store';
import { InMemoryTemplateRepository } from '@storage/template';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';

import type { RepositorySet } from '../contracts/harness';
import { describeRepositoryContract } from '../contracts/repositoryContract';

// Puts the in-memory adapter through the shared repository contract (task 109). Everything this
// file knows that the contract doesn't is right here: which classes to build and that they all
// go over one `InMemoryStore` — cross-entity operations only see each other's rows if they share
// it. The expo-sqlite adapter (task 067) gets a runner of its own, shaped exactly like this one.
function createInMemoryRepositories(): RepositorySet {
  const store = new InMemoryStore();

  return {
    muscleGroupRepo: new InMemoryMuscleGroupRepository(),
    exerciseRepo: new InMemoryExerciseRepository(store),
    mesocycleRepo: new InMemoryMesocycleRepository(store),
    sessionRepo: new InMemorySessionRepository(store),
    sessionExerciseRepo: new InMemorySessionExerciseRepository(store),
    setLogRepo: new InMemorySetLogRepository(store),
    settingsRepo: new InMemorySettingsRepository(),
    templateRepo: new InMemoryTemplateRepository(store),
    exerciseHistoryRepo: new InMemoryExerciseHistoryRepository(store),
    sessionTreeRepo: new InMemorySessionTreeRepository(store),
    workoutStore: createInMemoryWorkoutStore(store),
    mesocycleStartStore: createInMemoryMesocycleStartStore(store),
  };
}

describeRepositoryContract('in-memory', { create: async () => createInMemoryRepositories() });
